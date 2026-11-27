const { asyncRouter } = require('../utils/asyncRouter');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { getAvailableSlots } = require('../utils/slots');
const { availabilityLimiter } = require('../middleware/rateLimit');
const { parseId } = require('../utils/ids');
const { isValidDateString } = require('../utils/time');
const { validateCoords } = require('../utils/validation');
const { isInServiceArea, SERVICE_AREA_ERROR } = require('../utils/service-area');

const router = asyncRouter();

// GET /api/availability?date=2026-09-20&serviceId=2&petId=5&lat=4.65&lng=-74.05
router.get('/', requireAuth, availabilityLimiter, async (req, res) => {
  const { date, serviceId, petId, lat, lng } = req.query;
  if (!date || !serviceId || !petId || !lat || !lng) {
    return res.status(400).json({ error: 'date, serviceId, petId, lat y lng son requeridos' });
  }

  const parsedServiceId = parseId(serviceId);
  const parsedPetId = parseId(petId);
  if (!parsedServiceId || !parsedPetId) {
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
    'SELECT size FROM pets WHERE id = $1 AND owner_id = $2 AND deleted_at IS NULL',
    [parsedPetId, req.user.id]
  );
  const pet = petRes.rows[0];
  if (!pet) return res.status(404).json({ error: 'Mascota no encontrada' });

  const { slots, durationMinutes } = await getAvailableSlots({
    date,
    serviceId: parsedServiceId,
    petSize: pet.size,
    lat: coords.value.lat,
    lng: coords.value.lng,
  });

  res.json({ date, durationMinutes, slots });
});

module.exports = router;
