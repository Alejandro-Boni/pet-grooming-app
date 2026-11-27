// Utilidades puras de fecha/hora (sin base de datos ni red), fáciles de probar.

function timeToMinutes(t) {
  const [h, m] = String(t).split(':').map(Number);
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
function nowInBogota(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(now);
  const get = (type) => parts.find((p) => p.type === type).value;

  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    // Algunas versiones de ICU devuelven "24" para la medianoche con hour12:false.
    minutes: (Number(get('hour')) % 24) * 60 + Number(get('minute')),
  };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

function isValidDateString(value) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function isValidTimeString(value) {
  return typeof value === 'string' && TIME_RE.test(value);
}

/**
 * Normaliza una columna DATE a 'AAAA-MM-DD'. Acepta el string ya normalizado (lo que
 * devuelve pool.js con el type parser) o un objeto Date (que `pg` crea a medianoche
 * LOCAL del servidor, por eso se leen los componentes locales y no toISOString()).
 * Devuelve null si el valor no es una fecha válida.
 */
function toDateKey(value) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  return null;
}

module.exports = {
  timeToMinutes,
  minutesToTime,
  rangesOverlap,
  toIsoDepartAt,
  nowInBogota,
  isValidDateString,
  isValidTimeString,
  toDateKey,
};
