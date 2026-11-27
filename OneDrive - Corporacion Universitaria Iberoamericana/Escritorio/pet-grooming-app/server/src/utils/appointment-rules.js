// Reglas de negocio sobre citas existentes (cancelación y "ya pasó"), puras y testeables.
const { toDateKey, timeToMinutes, nowInBogota } = require('./time');

const CANCELLATION_WINDOW_MS = 4 * 60 * 60 * 1000;

// Las citas se agendan en hora de Bogotá (UTC-5, sin horario de verano).
function appointmentStartMs({ appointment_date, start_time }) {
  const date = toDateKey(appointment_date);
  if (!date || !start_time) return NaN;
  return new Date(`${date}T${String(start_time).slice(0, 5)}:00-05:00`).getTime();
}

function canCancelAppointment(appointment, now = Date.now()) {
  const startMs = appointmentStartMs(appointment);
  if (Number.isNaN(startMs)) return false;
  return now + CANCELLATION_WINDOW_MS <= startMs;
}

function hasAppointmentPassed({ appointment_date, end_time }, bogotaNow = nowInBogota()) {
  const appointmentDate = toDateKey(appointment_date);
  if (!appointmentDate) return false;

  return (
    appointmentDate < bogotaNow.date ||
    (appointmentDate === bogotaNow.date && timeToMinutes(end_time) <= bogotaNow.minutes)
  );
}

module.exports = {
  CANCELLATION_WINDOW_MS,
  appointmentStartMs,
  canCancelAppointment,
  hasAppointmentPassed,
};
