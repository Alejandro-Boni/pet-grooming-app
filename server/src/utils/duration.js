// Regla de negocio: la duración de un servicio se ajusta según el tamaño de la mascota.
// Un baño básico (base 45 min) toma menos tiempo en un perro pequeño y más en uno grande.
const SIZE_MULTIPLIER = {
  'pequeño': 0.75,
  'mediano': 1,
  'grande': 1.5,
};

const SLOT_GRANULARITY_MINUTES = 15;

/**
 * Calcula la duración real del bloque de tiempo para un servicio + tamaño de mascota,
 * redondeando hacia arriba al múltiplo de SLOT_GRANULARITY_MINUTES más cercano para
 * mantener alineado el calendario de agendamiento.
 */
function calculateDurationMinutes(baseDurationMinutes, petSize) {
  const multiplier = SIZE_MULTIPLIER[petSize] ?? 1;
  const rawMinutes = baseDurationMinutes * multiplier;
  return Math.ceil(rawMinutes / SLOT_GRANULARITY_MINUTES) * SLOT_GRANULARITY_MINUTES;
}

module.exports = { calculateDurationMinutes, SIZE_MULTIPLIER, SLOT_GRANULARITY_MINUTES };
