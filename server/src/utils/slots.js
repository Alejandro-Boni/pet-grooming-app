const pool = require('../db/pool');
const { calculateDurationMinutes, SLOT_GRANULARITY_MINUTES } = require('./duration');
const { getTravelMinutes } = require('./tomtom');

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
  return `${date}T${timeStr.length === 5 ? timeStr + ':00' : timeStr}`;
}

/**
 * Fecha y hora actuales en Bogotá (UTC-5), sin importar el huso horario del servidor
 * (Render corre en UTC). Evita ofrecer o permitir agendar horas que ya pasaron hoy.
 */
function nowInBogota() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type).value;

  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
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

  const wholeDayBlocked = blocksRes.rows.some((b) => b.start_time === null);
  if (wholeDayBlocked) return { slots: [], durationMinutes: 0 };

  const maxConcurrent = parseInt(settingsRes.rows[0]?.value ?? '1', 10);
  const durationMinutes = calculateDurationMinutes(service.base_duration_minutes, petSize);

  const openMin = timeToMinutes(hours.open_time);
  const closeMin = timeToMinutes(hours.close_time);

  const { date: todayBogota, minutes: nowMinutesBogota } = nowInBogota();
  const isToday = date === todayBogota;

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
  toIsoDepartAt,
  nowInBogota,
  FALLBACK_TRAVEL_MINUTES,
  timeToMinutes,
  minutesToTime,
  rangesOverlap,
};