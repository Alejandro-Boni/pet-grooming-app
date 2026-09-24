const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/requireAdmin');

const router = express.Router();
router.use(requireAuth, requireAdmin);

// Agenda del día con la "ficha técnica express": alertas de comportamiento/salud de cada mascota
router.get('/appointments', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date es requerido' });

  const result = await pool.query(
    `SELECT a.*, 
            p.name AS pet_name, p.species, p.breed, p.size,
            p.is_reactive, p.is_allergic, p.allergy_notes, p.is_geriatric, p.medical_conditions,
            s.name AS service_name,
            u.name AS client_name, u.phone AS client_phone
     FROM appointments a
     JOIN pets p ON p.id = a.pet_id
     JOIN services s ON s.id = a.service_id
     JOIN users u ON u.id = a.client_id
     WHERE a.appointment_date = $1
     ORDER BY a.start_time`,
    [date]
  );
  res.json({ appointments: result.rows });
});

router.patch('/appointments/:id', async (req, res) => {
  const { status, stylistNotes } = req.body;
  const result = await pool.query(
    `UPDATE appointments SET
       status = COALESCE($1, status),
       stylist_notes = COALESCE($2, stylist_notes)
     WHERE id = $3 RETURNING *`,
    [status || null, stylistNotes ?? null, req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Cita no encontrada' });
  res.json({ appointment: result.rows[0] });
});

// Historial de servicios de un cliente (qué se le hizo la última vez, notas del estilista)
router.get('/clients/:clientId/history', async (req, res) => {
  const result = await pool.query(
    `SELECT a.*, p.name AS pet_name, s.name AS service_name
     FROM appointments a
     JOIN pets p ON p.id = a.pet_id
     JOIN services s ON s.id = a.service_id
     WHERE a.client_id = $1
     ORDER BY a.appointment_date DESC, a.start_time DESC`,
    [req.params.clientId]
  );
  res.json({ appointments: result.rows });
});

// Buscar clientes por nombre/teléfono/correo (para abrir su historial)
router.get('/clients', async (req, res) => {
  const { q } = req.query;
  const result = await pool.query(
    `SELECT id, name, email, phone FROM users
     WHERE role = 'client' AND (name ILIKE $1 OR phone ILIKE $1 OR email ILIKE $1)
     ORDER BY name LIMIT 20`,
    [`%${q || ''}%`]
  );
  res.json({ clients: result.rows });
});

// Bloqueos de disponibilidad (días festivos, horas puntuales)
router.get('/blackouts', async (req, res) => {
  const result = await pool.query('SELECT * FROM availability_blocks ORDER BY block_date');
  res.json({ blackouts: result.rows });
});

router.post('/blackouts', async (req, res) => {
  const { date, startTime, endTime, reason } = req.body;
  const result = await pool.query(
    `INSERT INTO availability_blocks (block_date, start_time, end_time, reason)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [date, startTime || null, endTime || null, reason || null]
  );
  res.status(201).json({ blackout: result.rows[0] });
});

router.delete('/blackouts/:id', async (req, res) => {
  await pool.query('DELETE FROM availability_blocks WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

// Cupo máximo de mascotas atendidas simultáneamente
router.get('/settings', async (req, res) => {
  const result = await pool.query('SELECT key, value FROM settings');
  res.json({ settings: result.rows });
});

router.put('/settings/:key', async (req, res) => {
  const { value } = req.body;
  const result = await pool.query(
    `INSERT INTO settings (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = $2 RETURNING *`,
    [req.params.key, String(value)]
  );
  res.json({ setting: result.rows[0] });
});

module.exports = router;
