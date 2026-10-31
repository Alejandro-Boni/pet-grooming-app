const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { calculateDurationMinutes } = require('../utils/duration');
const {
  timeToMinutes,
  minutesToTime,
  rangesOverlap,
  toIsoDepartAt,
  nowInBogota,
  FALLBACK_TRAVEL_MINUTES,
} = require('../utils/slots');
const { getTravelMinutes } = require('../utils/tomtom');
const { calculateServicePrice } = require('../utils/pricing');

const router = express.Router();
router.use(requireAuth);

function canCancelAppointment({ appointment_date, start_time }) {
  const appointmentStart = new Date(`${appointment_date}T${start_time}:00-05:00`).getTime();
  const now = Date.now();
  const cancellationWindowMs = 4 * 60 * 60 * 1000;

  return now + cancellationWindowMs <= appointmentStart;
}

router.post('/', async (req, res) => {
  const { petId, serviceId, date, startTime, address, lat, lng } = req.body;
  if (!petId || !serviceId || !date || !startTime || !address || lat === undefined || lng === undefined) {
    return res.status(400).json({ error: 'petId, serviceId, date, startTime, address, lat y lng son requeridos' });
  }

  const startMin = timeToMinutes(startTime);

  const { date: todayBogota, minutes: nowMinutesBogota } = nowInBogota();
  if (date === todayBogota && startMin <= nowMinutesBogota) {
    return res.status(409).json({ error: 'Esa hora ya pasó. Elige un horario futuro.' });
  }
  if (date < todayBogota) {
    return res.status(409).json({ error: 'No se puede agendar en una fecha pasada.' });
  }

  const client = await pool.connect();

  try {
    const petRes = await client.query('SELECT * FROM pets WHERE id = $1 AND owner_id = $2', [petId, req.user.id]);
    const pet = petRes.rows[0];
    if (!pet) return res.status(404).json({ error: 'Mascota no encontrada' });

    const serviceRes = await client.query('SELECT * FROM services WHERE id = $1 AND active = true', [serviceId]);
    const service = serviceRes.rows[0];
    if (!service) return res.status(404).json({ error: 'Servicio no encontrado' });

    const finalPriceCop = calculateServicePrice(service.price_cop, pet.size);
    const durationMinutes = calculateDurationMinutes(service.base_duration_minutes, pet.size);
    const endMin = startMin + durationMinutes;
    const endTime = minutesToTime(endMin);
    const candidateCoord = { lat: Number(lat), lng: Number(lng) };

    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [date]);

    const settingsRes = await client.query("SELECT value FROM settings WHERE key = 'max_concurrent_pets'");
    const maxConcurrent = parseInt(settingsRes.rows[0]?.value ?? '1', 10);

    const blockRes = await client.query(
      'SELECT start_time, end_time FROM availability_blocks WHERE block_date = $1',
      [date]
    );
    const wholeDayBlocked = blockRes.rows.some((b) => b.start_time === null);
    const hitsBlock = blockRes.rows.some(
      (b) =>
        b.start_time !== null &&
        rangesOverlap(startMin, endMin, timeToMinutes(b.start_time), timeToMinutes(b.end_time))
    );
    if (wholeDayBlocked || hitsBlock) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Ese día u horario no está disponible' });
    }

    const existingRes = await client.query(
      "SELECT id, start_time, end_time, lat, lng FROM appointments WHERE appointment_date = $1 AND status != 'cancelled' FOR UPDATE",
      [date]
    );
    const existingAppts = existingRes.rows
      .map((a) => ({
        id: a.id,
        start: timeToMinutes(a.start_time),
        end: timeToMinutes(a.end_time),
        startTimeStr: a.start_time,
        endTimeStr: a.end_time,
        lat: a.lat,
        lng: a.lng,
      }))
      .sort((a, b) => a.start - b.start);

    const overlapping = existingAppts.filter((a) => rangesOverlap(startMin, endMin, a.start, a.end)).length;
    if (overlapping >= maxConcurrent) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Ese horario acaba de ser reservado por otro cliente. Elige otro.' });
    }

    const previous = [...existingAppts].reverse().find((a) => a.end <= startMin);
    const next = existingAppts.find((a) => a.start >= endMin);

    if (previous) {
      const needed = await getTravelMinutes(
        { lat: previous.lat, lng: previous.lng },
        candidateCoord,
        toIsoDepartAt(date, previous.endTimeStr)
      ).catch(() => FALLBACK_TRAVEL_MINUTES);

      if (startMin - previous.end < needed) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'No alcanza el tiempo de traslado desde la cita anterior. Elige otro horario.' });
      }
    }

    if (next) {
      const needed = await getTravelMinutes(
        candidateCoord,
        { lat: next.lat, lng: next.lng },
        toIsoDepartAt(date, next.startTimeStr)
      ).catch(() => FALLBACK_TRAVEL_MINUTES);

      if (next.start - endMin < needed) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'No alcanza el tiempo de traslado hacia la siguiente cita. Elige otro horario.' });
      }
    }

    const inserted = await client.query(
      `INSERT INTO appointments (
         client_id, pet_id, service_id, address, lat, lng, appointment_date, start_time, end_time, final_price_cop
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [req.user.id, petId, serviceId, address, lat, lng, date, startTime, endTime, finalPriceCop]
    );

    await client.query('COMMIT');
    res.status(201).json({
      appointment: {
        ...inserted.rows[0],
        final_price_cop: finalPriceCop,
      },
      final_price_cop: finalPriceCop,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creando cita', err);
    res.status(500).json({ error: 'No se pudo crear la cita' });
  } finally {
    client.release();
  }
});

router.get('/mine', async (req, res) => {
  const result = await pool.query(
    `SELECT a.*, p.name AS pet_name, s.name AS service_name, s.price_cop
     FROM appointments a
     JOIN pets p ON p.id = a.pet_id
     JOIN services s ON s.id = a.service_id
     WHERE a.client_id = $1
     ORDER BY a.appointment_date DESC, a.start_time DESC`,
    [req.user.id]
  );
  res.json({ appointments: result.rows });
});

router.delete('/:id', async (req, res) => {
  const appointmentRes = await pool.query(
    "SELECT * FROM appointments WHERE id = $1 AND client_id = $2",
    [req.params.id, req.user.id]
  );

  const appointment = appointmentRes.rows[0];
  if (!appointment) {
    return res.status(404).json({ error: 'Cita no encontrada' });
  }

  if (appointment.status !== 'pending') {
    return res.status(409).json({ error: 'Solo se pueden cancelar citas pendientes.' });
  }

  if (!canCancelAppointment(appointment)) {
    return res.status(409).json({
      error: 'La cancelación debe hacerse con al menos 4 horas de anticipación.',
    });
  }

  const result = await pool.query(
    "UPDATE appointments SET status = 'cancelled' WHERE id = $1 AND client_id = $2 RETURNING *",
    [req.params.id, req.user.id]
  );

  res.json({ appointment: result.rows[0] });
});

module.exports = router;