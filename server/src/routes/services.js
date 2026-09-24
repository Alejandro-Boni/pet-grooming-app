const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const result = await pool.query('SELECT * FROM services WHERE active = true ORDER BY id');
  res.json({ services: result.rows });
});

module.exports = router;
