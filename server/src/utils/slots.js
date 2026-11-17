const pool = require('../db/pool');
const { calculateDurationMinutes, SLOT_GRANULARITY_MINUTES } = require('./duration');
const { getTravelMinutes } = require('./tomtom');
const {
  timeToMinutes,
  minutesToTime,
  rangesOverlap,
  toIsoDepartAt,
  nowInBogota,
} = require('./time');
const { splitBlocks } = require('./blackouts');

const FALLBACK_TRAVEL_MINUTES = 60;

function toSortedAppointments(rows) {
  return rows
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
}

// Cita vecina anterior (termina antes o justo cuando empieza la candidata) y siguiente.
function findNeighbors(sortedAppointments, candidateStart, candidateEnd) {
  const previous = [...sortedAppointments].reverse().find((a) => a.end <= candidateStart) || null;
  const next = sortedAppointments.find((a) => a.start >= candidateEnd) || null;
  return { previous, next };
}

// Tiempo de traslado con tráfico; si TomTom falla o tarda, usa el buffer conservador y deja
// constancia en el log (antes el fallo de la reserva era silencioso).
async function travelMinutesOrFallback(from, to, departAt, label) {
  try {
    return await getTravelMinutes(from, to, departAt);
  } catch (err) {
    console.error(
      `TomTom (${label}) falló, usando buffer conservador de ${FALLBACK_TRAVEL_MINUTES} min:`,
      err.message
    );
    return FALLBACK_TRAVEL_MINUTES;
  }
}

async function buildTravelCache({ date, candidateCoord, existingAppts }) {
  const cache = new Map();

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

  const { wholeDay: wholeDayBlocked, ranges: blockedRanges } = splitBlocks(blocksRes.rows);
  if (wholeDayBlocked) return { slots: [], durationMinutes: 0 };

  const maxConcurrent = parseInt(settingsRes.rows[0]?.value ?? '1', 10);
  const durationMinutes = calculateDurationMinutes(service.base_duration_minutes, petSize, service.name);

  const openMin = timeToMinutes(hours.open_time);
  const closeMin = timeToMinutes(hours.close_time);

  const { date: todayBogota, minutes: nowMinutesBogota } = nowInBogota();
  const isToday = date === todayBogota;

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
    if (isToday && candidateStart <= nowMinutesBogota) continue;

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
  toSortedAppointments,
  findNeighbors,
  travelMinutesOrFallback,
  toIsoDepartAt,
  nowInBogota,
  FALLBACK_TRAVEL_MINUTES,
  timeToMinutes,
  minutesToTime,
  rangesOverlap,
};