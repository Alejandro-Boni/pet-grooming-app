const pool = require('../db/pool');
const { calculateDurationMinutes, SLOT_GRANULARITY_MINUTES } = require('./duration');
const { getTravelMinutes } = require('./tomtom');

// Si TomTom falla para un vecino puntual (dirección rara, error transitorio de red), se asume
// un traslado conservador en vez de ignorar la validación — así el sistema falla hacia el lado
// seguro (ofrece menos horarios) en lugar de arriesgarse a un cruce de citas.
const FALLBACK_TRAVEL_MINUTES = 60;

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins) {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function toIsoDepartAt(date, timeStr) {
  // date: "YYYY-MM-DD", timeStr: "HH:MM" o "HH:MM:SS" → ISO local sin offset explícito
  // (Node/TomTom lo interpretan como hora del servidor; ver nota en el README sobre zona horaria).
  return `${date}T${timeStr.length === 5 ? timeStr + ':00' : timeStr}`;
}

/**
 * Calcula, UNA sola vez por cita vecina (no por cada franja de 15 min candidata), los minutos
 * de traslado en ambos sentidos entre esa cita y la ubicación de la nueva cita candidata. Esto
 * mantiene el consumo de la cuota gratuita de TomTom bajo control incluso si el día tiene
 * muchas franjas candidatas.
 */
async function buildTravelCache({ date, candidateCoord, existingAppts }) {
  const cache = new Map(); // apptId -> { toCandidate, fromCandidate } en minutos

  await Promise.all(
    existingAppts.map(async (appt) => {
      const apptCoord = { lat: appt.lat, lng: appt.lng };
      const [toCandidate, fromCandidate] = await Promise.all([
        getTravelMinutes(apptCoord, candidateCoord, toIsoDepartAt(date, appt.endTimeStr)).catch((err) => {
          console.error('TomTom (vecino → candidata) falló, usando buffer conservador', err.message);
          return FALLBACK_TRAVEL_MINUTES;
        }),
        getTravelMinutes(candidateCoord, apptCoord, toIsoDepartAt(date, appt.startTimeStr)).catch((err) => {
          console.error('TomTom (candidata → vecino) falló, usando buffer conservador', err.message);
          return FALLBACK_TRAVEL_MINUTES;
        }),
      ]);
      cache.set(appt.id, { toCandidate, fromCandidate });
    })
  );

  return cache;
}

/**
 * Con un solo vehículo, las citas del día forman una sola ruta secuencial. Esta función
 * revisa únicamente la cita inmediatamente anterior y la inmediatamente siguiente a la
 * franja candidata (las demás no importan: si el hueco alcanza con las vecinas, alcanza
 * con todas). Devuelve true si hay tiempo de traslado suficiente hacia y desde la nueva cita,
 * según los minutos ya calculados por TomTom en `travelCache`.
 *
 * NOTA: si el negocio llega a sumar un segundo vehículo, esta función ya no alcanza —
 * habría que asignar cada cita a un vehículo/ruta (un problema distinto, de ruteo).
 */
function hasTravelBuffer({ candidateStart, candidateEnd, sortedAppointments, travelCache }) {
  const previous = [...sortedAppointments].reverse().find((a) => a.end <= candidateStart);
  const next = sortedAppointments.find((a) => a.start >= candidateEnd);

  if (previous) {
    const needed = travelCache.get(previous.id)?.toCandidate ?? FALLBACK_TRAVEL_MINUTES;
    if (candidateStart - previous.end < needed) return false;
  }
  if (next) {
    const needed = travelCache.get(next.id)?.fromCandidate ?? FALLBACK_TRAVEL_MINUTES;
    if (next.start - candidateEnd < needed) return false;
  }
  return true;
}

/**
 * Devuelve la lista de horas de inicio disponibles (formato "HH:MM") para una fecha,
 * dado un servicio, el tamaño de la mascota y la ubicación (lat/lng) donde se prestará
 * el servicio. Considera:
 *  - horario de atención del día de la semana
 *  - bloqueos de disponibilidad (día completo o rangos de horas)
 *  - cupo máximo de mascotas simultáneas (settings.max_concurrent_pets)
 *  - citas ya existentes ese día (sin contar las canceladas)
 *  - tiempo de traslado real (con tráfico, vía TomTom) hacia/desde la cita anterior y la siguiente
 */
async function getAvailableSlots({ date, serviceId, petSize, lat, lng }) {
  const dayOfWeek = new Date(`${date}T00:00:00`).getDay();

  const [hoursRes, serviceRes, settingsRes, blocksRes, apptsRes] = await Promise.all([
    pool.query('SELECT * FROM business_hours WHERE day_of_week = $1', [dayOfWeek]),
    pool.query('SELECT * FROM services WHERE id = $1 AND active = true', [serviceId]),
    pool.query("SELECT value FROM settings WHERE key = 'max_concurrent_pets'"),
    pool.query('SELECT start_time, end_time FROM availability_blocks WHERE block_date = $1', [date]),
    pool.query(
      "SELECT id, start_time, end_time, lat, lng FROM appointments WHERE appointment_date = $1 AND status != 'cancelled'",
      [date]
    ),
  ]);

  const hours = hoursRes.rows[0];
  const service = serviceRes.rows[0];
  if (!hours || hours.is_closed || !service) return { slots: [], durationMinutes: 0 };

  const wholeDayBlocked = blocksRes.rows.some((b) => b.start_time === null);
  if (wholeDayBlocked) return { slots: [], durationMinutes: 0 };

  const maxConcurrent = parseInt(settingsRes.rows[0]?.value ?? '1', 10);
  const durationMinutes = calculateDurationMinutes(service.base_duration_minutes, petSize);

  const openMin = timeToMinutes(hours.open_time);
  const closeMin = timeToMinutes(hours.close_time);

  const blockedRanges = blocksRes.rows
    .filter((b) => b.start_time !== null)
    .map((b) => ({ start: timeToMinutes(b.start_time), end: timeToMinutes(b.end_time) }));

  const existingAppts = apptsRes.rows
    .map((a) => ({
      id: a.id,
      start: timeToMinutes(a.start_time),
      end: timeToMinutes(a.end_time),
      startTimeStr: a.start_time,
      endTimeStr: a.end_time,
      lat: a.lat,
      lng: a.lng,
    }))
    .sort((a, b) => a.start - b.start);

  // Solo se llama a TomTom si de verdad hay citas vecinas ese día — un día vacío no gasta cuota.
  const travelCache =
    existingAppts.length > 0
      ? await buildTravelCache({ date, candidateCoord: { lat, lng }, existingAppts })
      : new Map();

  const available = [];
  for (
    let candidateStart = openMin;
    candidateStart + durationMinutes <= closeMin;
    candidateStart += SLOT_GRANULARITY_MINUTES
  ) {
    const candidateEnd = candidateStart + durationMinutes;

    const hitsBlock = blockedRanges.some((b) => rangesOverlap(candidateStart, candidateEnd, b.start, b.end));
    if (hitsBlock) continue;

    const overlappingCount = existingAppts.filter((a) =>
      rangesOverlap(candidateStart, candidateEnd, a.start, a.end)
    ).length;
    if (overlappingCount >= maxConcurrent) continue;

    if (!hasTravelBuffer({ candidateStart, candidateEnd, sortedAppointments: existingAppts, travelCache })) {
      continue;
    }

    available.push(minutesToTime(candidateStart));
  }

  return { slots: available, durationMinutes };
}

module.exports = {
  getAvailableSlots,
  hasTravelBuffer,
  buildTravelCache,
  toIsoDepartAt,
  FALLBACK_TRAVEL_MINUTES,
  timeToMinutes,
  minutesToTime,
  rangesOverlap,
};
