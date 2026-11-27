// Regla de negocio: la duración de un servicio se ajusta según el tamaño de la mascota.
// Un baño básico (base 45 min) toma menos tiempo en un perro pequeño y más en uno grande.
// 'gigante' parte igual que 'grande' (1.5): ajústalo cuando tengas el dato real del negocio.
const { isDogSizeNamedService } = require('./service-rules');

const SIZE_MULTIPLIER = {
  'pequeño': 0.75,
  'mediano': 1,
  'grande': 1.5,
  'gigante': 1.5,
};

const SLOT_GRANULARITY_MINUTES = 15;

/**
 * Calcula la duración real del bloque de tiempo para un servicio + tamaño de mascota,
 * redondeando hacia arriba al múltiplo de SLOT_GRANULARITY_MINUTES más cercano para
 * mantener alineado el calendario de agendamiento.
 *
 * Si se pasa `serviceName` y el servicio ya es específico de un tamaño de perro
 * ("Baño perro grande"), no se aplica el multiplicador (mismo criterio que el precio).
 */
function calculateDurationMinutes(baseDurationMinutes, petSize, serviceName) {
  const multiplier = isDogSizeNamedService(serviceName) ? 1 : (SIZE_MULTIPLIER[petSize] ?? 1);
  const rawMinutes = baseDurationMinutes * multiplier;
  return Math.ceil(rawMinutes / SLOT_GRANULARITY_MINUTES) * SLOT_GRANULARITY_MINUTES;
}

module.exports = { calculateDurationMinutes, SIZE_MULTIPLIER, SLOT_GRANULARITY_MINUTES };
