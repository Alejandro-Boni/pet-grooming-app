// Validación de bloqueos de disponibilidad y lectura tolerante de filas ya guardadas.
const { isValidDateString, isValidTimeString, timeToMinutes } = require('./time');

/**
 * Valida el body de POST /admin/blackouts.
 * Reglas: fecha válida; hora de inicio y de fin van juntas (ambas o ninguna, que significa
 * "todo el día"); el inicio debe ser anterior al fin.
 * Devuelve { error } o { value: { date, startTime, endTime, reason } } normalizado a HH:MM.
 */
function validateBlackout(body = {}) {
  const { date, startTime, endTime, reason } = body;

  if (!isValidDateString(date)) {
    return { error: 'La fecha no es válida (usa AAAA-MM-DD).' };
  }

  const hasStart = startTime !== undefined && startTime !== null && startTime !== '';
  const hasEnd = endTime !== undefined && endTime !== null && endTime !== '';

  if (hasStart !== hasEnd) {
    return { error: 'Indica la hora de inicio y la de fin, o deja ambas vacías para bloquear todo el día.' };
  }

  let start = null;
  let end = null;

  if (hasStart) {
    if (!isValidTimeString(startTime) || !isValidTimeString(endTime)) {
      return { error: 'Las horas no son válidas (usa HH:MM).' };
    }
    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      return { error: 'La hora de inicio debe ser anterior a la hora de fin.' };
    }
    start = startTime.slice(0, 5);
    end = endTime.slice(0, 5);
  }

  const cleanReason = reason === undefined || reason === null ? '' : String(reason).trim();
  if (cleanReason.length > 200) {
    return { error: 'El motivo no puede superar 200 caracteres.' };
  }

  return { value: { date, startTime: start, endTime: end, reason: cleanReason || null } };
}

/**
 * Convierte las filas de availability_blocks de un día en { wholeDay, ranges }.
 * Es defensivo con datos viejos o malos: un bloqueo sin hora de inicio es de todo el día,
 * y uno con inicio pero sin fin se interpreta como "desde el inicio hasta el final del día"
 * en lugar de lanzar un error que tumbaría todas las reservas de esa fecha.
 */
function splitBlocks(rows = []) {
  let wholeDay = false;
  const ranges = [];

  for (const row of rows) {
    if (row.start_time === null || row.start_time === undefined) {
      wholeDay = true;
      continue;
    }
    ranges.push({
      start: timeToMinutes(row.start_time),
      end: row.end_time ? timeToMinutes(row.end_time) : 24 * 60,
    });
  }

  return { wholeDay, ranges };
}

module.exports = { validateBlackout, splitBlocks };
