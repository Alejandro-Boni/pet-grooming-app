const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { getAvailableSlots } = require('../utils/slots');

const router = express.Router();

// GET /api/availability?date=2026-09-20&serviceId=2&petId=5&lat=4.65&lng=-74.05
router.get('/', requireAuth, async (req, res) => {
  const { date, serviceId, petId, lat, lng } = req.query;
  if (!date || !serviceId || !petId || !lat || !lng) {
    return res.status(400).json({ error: 'date, serviceId, petId, lat y lng son requeridos' });
  }

  const petRes = await pool.query('SELECT size FROM pets WHERE id = $1 AND owner_id = $2', [petId, req.user.id]);
  const pet = petRes.rows[0];
  if (!pet) return res.status(404).json({ error: 'Mascota no encontrada' });

  const { slots, durationMinutes } = await getAvailableSlots({
    date,
    serviceId: Number(serviceId),
    petSize: pet.size,
    lat: Number(lat),
    lng: Number(lng),
  });

  res.json({ date, durationMinutes, slots });
});

module.exports = router;
