const { asyncRouter } = require('../utils/asyncRouter');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { getAvailableSlots } = require('../utils/slots');
const { availabilityLimiter } = require('../middleware/rateLimit');
const { parseId, parseIdList } = require('../utils/ids');
const { isValidDateString } = require('../utils/time');
const { validateCoords } = require('../utils/validation');
const { isInServiceArea, SERVICE_AREA_ERROR } = require('../utils/service-area');
const { isServiceAvailableForPet } = require('../utils/service-rules');
const { calculateServiceTotals } = require('../utils/service-selection');

const router = asyncRouter();

// GET /api/availability?date=2026-09-20&serviceIds=2,3&petId=5&lat=4.65&lng=-74.05
router.get('/', requireAuth, availabilityLimiter, async (req, res) => {
  const { date, serviceIds: rawServiceIds, serviceId: legacyServiceId, petId, lat, lng } = req.query;
  if (!date || (!rawServiceIds && !legacyServiceId) || !petId || !lat || !lng) {
    return res.status(400).json({
      error: 'date, serviceIds, petId, lat y lng son requeridos',
    });
  }

  const parsedServiceIds = parseIdList(
    rawServiceIds
      ? typeof rawServiceIds === 'string'
        ? rawServiceIds.split(',')
        : []
      : [legacyServiceId]
  );
  const parsedPetId = parseId(petId);
  if (!parsedServiceIds || !parsedPetId) {
    return res.status(400).json({ error: 'El servicio o la mascota indicados no son válidos' });
  }
  if (!isValidDateString(date)) {
    return res.status(400).json({ error: 'La fecha no es válida (usa AAAA-MM-DD).' });
  }
  const coords = validateCoords(lat, lng);
  if (coords.error) return res.status(400).json({ error: coords.error });
  if (!isInServiceArea(coords.value.lat, coords.value.lng)) {
    return res.status(400).json({ error: SERVICE_AREA_ERROR });
  }

  const petRes = await pool.query(
    'SELECT species, size FROM pets WHERE id = $1 AND owner_id = $2 AND deleted_at IS NULL',
    [parsedPetId, req.user.id]
  );
  const pet = petRes.rows[0];
  if (!pet) return res.status(404).json({ error: 'Mascota no encontrada' });

  const servicesRes = await pool.query(
    'SELECT * FROM services WHERE id = ANY($1::int[]) AND active = true',
    [parsedServiceIds]
  );
  const servicesById = new Map(servicesRes.rows.map((service) => [service.id, service]));
  const services = parsedServiceIds.map((id) => servicesById.get(id));
  if (services.some((service) => !service)) {
    return res.status(404).json({ error: 'Uno o más servicios no están disponibles' });
  }
  if (services.some((service) => !isServiceAvailableForPet(service, pet))) {
    return res.status(400).json({
      error: 'Uno o más servicios no están disponibles para esta mascota.',
    });
  }

  const serviceTotals = calculateServiceTotals(services, pet.size);
  const { slots } = await getAvailableSlots({
    date,
    services,
    petSize: pet.size,
    lat: coords.value.lat,
    lng: coords.value.lng,
  });

  res.json({ date, durationMinutes: serviceTotals.durationMinutes, slots });
});

module.exports = router;
