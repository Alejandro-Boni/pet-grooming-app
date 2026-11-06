const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { calculateServicePrice } = require('../utils/pricing');
const { isServiceAvailableForPet } = require('../utils/service-rules');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const result = await pool.query('SELECT * FROM services WHERE active = true ORDER BY id');
  const { petId } = req.query;

  if (!petId) {
    return res.json({ services: result.rows });
  }

  const petResult = await pool.query(
    'SELECT species, size FROM pets WHERE id = $1 AND owner_id = $2',
    [petId, req.user.id]
  );
  const pet = petResult.rows[0];

  if (!pet) {
    return res.status(404).json({ error: 'Mascota no encontrada' });
  }

  const services = result.rows
    .filter((service) => isServiceAvailableForPet(service, pet))
    .map((service) => ({
      ...service,
      final_price_cop: calculateServicePrice(service.price_cop, pet.size, service.name),
    }));

  return res.json({ services });
});

module.exports = router;
