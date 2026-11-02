const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/requireAdmin');
const { buildWhatsAppLink } = require('../services/whatsapp');

const router = express.Router();
router.use(requireAuth, requireAdmin);

router.get('/appointments', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date es requerido' });

  const result = await pool.query(
    `SELECT a.*,
            CASE
              WHEN a.status = 'pending'
                AND (a.appointment_date + a.end_time) <= (NOW() AT TIME ZONE 'America/Bogota')
              THEN 'past'
              ELSE a.status
            END AS display_status,
            p.name AS pet_name, p.species, p.breed, p.size,
            p.is_reactive, p.is_allergic, p.allergy_notes, p.is_geriatric, p.medical_conditions,
            s.name AS service_name, s.price_cop,
            u.name AS client_name,
            COALESCE(a.client_phone, u.phone) AS client_phone
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

  const current = await pool.query(
    `SELECT a.*, u.phone, p.name AS pet_name,
            COALESCE(a.client_phone, u.phone) AS contact_phone
     FROM appointments a
     JOIN users u ON u.id = a.client_id
     JOIN pets p ON p.id = a.pet_id
     WHERE a.id = $1`,
    [req.params.id]
  );

  if (!current.rows[0]) {
    return res.status(404).json({ error: 'Cita no encontrada' });
  }

  const result = await pool.query(
    `UPDATE appointments SET
       status = COALESCE($1, status),
       stylist_notes = COALESCE($2, stylist_notes)
     WHERE id = $3 RETURNING *`,
    [status || null, stylistNotes ?? null, req.params.id]
  );

  if (!result.rows[0]) {
    return res.status(404).json({ error: 'Cita no encontrada' });
  }

  let whatsappLink = null;

  if (status === 'done') {
    const phone = current.rows[0].contact_phone;
    const message =
      'Hola, tu servicio en Mascota Rey ya terminó. Puedes pasar a recoger a tu mascota cuando quieras. Gracias por confiar en nosotros.';

    whatsappLink = buildWhatsAppLink(phone, message);

    await pool.query(
      `INSERT INTO appointment_reminders (appointment_id, type, status, sent_at, phone, message)
       VALUES ($1, $2, 'sent', NOW(), $3, $4)`,
      [req.params.id, 'service_finished', phone, message]
    );
  }

  res.json({
    appointment: result.rows[0],
    whatsapp_link: whatsappLink,
  });
});

router.post('/appointments/:id/send-pickup-reminder', async (req, res) => {
  const appointmentRes = await pool.query(
    `SELECT a.*, u.phone,
            COALESCE(a.client_phone, u.phone) AS contact_phone
     FROM appointments a
     JOIN users u ON u.id = a.client_id
     WHERE a.id = $1`,
    [req.params.id]
  );

  const appointment = appointmentRes.rows[0];
  if (!appointment) {
    return res.status(404).json({ error: 'Cita no encontrada' });
  }

  const phone = appointment.contact_phone;
  const message =
    'Tu mascota ya está lista para recoger. Puedes pasar por ella en el vehículo móvil de Mascota Rey.';

  const whatsappLink = buildWhatsAppLink(phone, message);

  await pool.query(
    `INSERT INTO appointment_reminders (appointment_id, type, status, sent_at, phone, message)
     VALUES ($1, $2, 'sent', NOW(), $3, $4)`,
    [appointment.id, 'pickup_ready', phone, message]
  );

  res.json({
    ok: true,
    whatsapp_link: whatsappLink,
    message: 'Recordatorio de recogida listo',
  });
});

router.get('/clients/:clientId/history', async (req, res) => {
  const result = await pool.query(
    `SELECT a.*, p.name AS pet_name, s.name AS service_name, s.price_cop,
            CASE
              WHEN a.status = 'pending'
                AND (a.appointment_date + a.end_time) <= (NOW() AT TIME ZONE 'America/Bogota')
              THEN 'past'
              ELSE a.status
            END AS display_status
     FROM appointments a
     JOIN pets p ON p.id = a.pet_id
     JOIN services s ON s.id = a.service_id
     WHERE a.client_id = $1
     ORDER BY a.appointment_date DESC, a.start_time DESC`,
    [req.params.clientId]
  );
  res.json({ appointments: result.rows });
});

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