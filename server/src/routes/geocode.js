const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { geocodeAddress } = require('../utils/tomtom');

const router = express.Router();

// POST /api/geocode  Body: { address: "Calle 123 #45-67, Bogotá" }
router.post('/', requireAuth, async (req, res) => {
  const { address } = req.body;
  if (!address || !address.trim()) return res.status(400).json({ error: 'address es requerido' });

  try {
    const result = await geocodeAddress(address.trim());
    res.json(result);
  } catch (err) {
    res.status(422).json({ error: err.message });
  }
});

module.exports = router;
