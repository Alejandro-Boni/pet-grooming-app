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
  const appointmentStart = new Date(
    `${appointment_date}T${String(start_time).slice(0, 5)}:00-05:00`
  ).getTime();

  const cancellationWindowMs = 4 * 60 * 60 * 1000;
  return Date.now() + cancellationWindowMs <= appointmentStart;
}

function hasAppointmentPassed({ appointment_date, end_time }) {
  const { date: today, minutes: nowMinutes } = nowInBogota();
  const appointmentDate =
    appointment_date instanceof Date
      ? appointment_date.toISOString().slice(0, 10)
      : appointment_date;
  const appointmentEndMinutes = timeToMinutes(end_time);

  return (
    appointmentDate < today ||
    (appointmentDate === today && appointmentEndMinutes <= nowMinutes)
  );
}

function isValidPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

router.post('/', async (req, res) => {
  const {
    petId,
    serviceId,
    date,
    startTime,
    address,
    lat,
    lng,
    clientPhone,
  } = req.body;

  if (
    !petId ||
    !serviceId ||
    !date ||
    !startTime ||
    !address ||
    lat === undefined ||
    lng === undefined
  ) {
    return res.status(400).json({
      error:
        'petId, serviceId, date, startTime, address, lat y lng son requeridos',
    });
  }

  const phone = String(clientPhone || '').trim();

  if (!phone || !isValidPhone(phone)) {
    return res.status(400).json({
      error: 'Ingresa un número de celular válido para poder agendar.',
    });
  }

  const startMin = timeToMinutes(startTime);
  const { date: todayBogota, minutes: nowMinutesBogota } = nowInBogota();

  if (date === todayBogota && startMin <= nowMinutesBogota) {
    return res.status(409).json({
      error: 'Esa hora ya pasó. Elige un horario futuro.',
    });
  }

  if (date < todayBogota) {
    return res.status(409).json({
      error: 'No se puede agendar en una fecha pasada.',
    });
  }

  const client = await pool.connect();
  let transactionStarted = false;

  try {
    const petRes = await client.query(
      'SELECT * FROM pets WHERE id = $1 AND owner_id = $2',
      [petId, req.user.id]
    );
    const pet = petRes.rows[0];

    if (!pet) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }

    const serviceRes = await client.query(
      'SELECT * FROM services WHERE id = $1 AND active = true',
      [serviceId]
    );
    const service = serviceRes.rows[0];

    if (!service) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    const finalPriceCop = calculateServicePrice(service.price_cop, pet.size);
    const durationMinutes = calculateDurationMinutes(
      service.base_duration_minutes,
      pet.size
    );
    const endMin = startMin + durationMinutes;
    const endTime = minutesToTime(endMin);
    const candidateCoord = { lat: Number(lat), lng: Number(lng) };

    await client.query('BEGIN');
    transactionStarted = true;

    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [date]);

    const settingsRes = await client.query(
      "SELECT value FROM settings WHERE key = 'max_concurrent_pets'"
    );
    const maxConcurrent = parseInt(settingsRes.rows[0]?.value ?? '1', 10);

    const blockRes = await client.query(
      'SELECT start_time, end_time FROM availability_blocks WHERE block_date = $1',
      [date]
    );

    const wholeDayBlocked = blockRes.rows.some((block) => block.start_time === null);
    const hitsBlock = blockRes.rows.some(
      (block) =>
        block.start_time !== null &&
        rangesOverlap(
          startMin,
          endMin,
          timeToMinutes(block.start_time),
          timeToMinutes(block.end_time)
        )
    );

    if (wholeDayBlocked || hitsBlock) {
      await client.query('ROLLBACK');
      transactionStarted = false;
      return res.status(409).json({
        error: 'Ese día u horario no está disponible',
      });
    }

    const existingRes = await client.query(
      `SELECT id, start_time, end_time, lat, lng
       FROM appointments
       WHERE appointment_date = $1
         AND status != 'cancelled'
       FOR UPDATE`,
      [date]
    );

    const existingAppointments = existingRes.rows
      .map((appointment) => ({
        id: appointment.id,
        start: timeToMinutes(appointment.start_time),
        end: timeToMinutes(appointment.end_time),
        startTimeStr: appointment.start_time,
        endTimeStr: appointment.end_time,
        lat: appointment.lat,
        lng: appointment.lng,
      }))
      .sort((a, b) => a.start - b.start);

    const overlapping = existingAppointments.filter((appointment) =>
      rangesOverlap(startMin, endMin, appointment.start, appointment.end)
    ).length;

    if (overlapping >= maxConcurrent) {
      await client.query('ROLLBACK');
      transactionStarted = false;
      return res.status(409).json({
        error: 'Ese horario acaba de ser reservado por otro cliente. Elige otro.',
      });
    }

    const previous = [...existingAppointments]
      .reverse()
      .find((appointment) => appointment.end <= startMin);
    const next = existingAppointments.find(
      (appointment) => appointment.start >= endMin
    );

    if (previous) {
      const needed = await getTravelMinutes(
        { lat: previous.lat, lng: previous.lng },
        candidateCoord,
        toIsoDepartAt(date, previous.endTimeStr)
      ).catch(() => FALLBACK_TRAVEL_MINUTES);

      if (startMin - previous.end < needed) {
        await client.query('ROLLBACK');
        transactionStarted = false;
        return res.status(409).json({
          error:
            'No alcanza el tiempo de traslado desde la cita anterior. Elige otro horario.',
        });
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
        transactionStarted = false;
        return res.status(409).json({
          error:
            'No alcanza el tiempo de traslado hacia la siguiente cita. Elige otro horario.',
        });
      }
    }

    const inserted = await client.query(
      `INSERT INTO appointments (
         client_id,
         pet_id,
         service_id,
         address,
         lat,
         lng,
         appointment_date,
         start_time,
         end_time,
         final_price_cop,
         client_phone
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        req.user.id,
        petId,
        serviceId,
        address,
        lat,
        lng,
        date,
        startTime,
        endTime,
        finalPriceCop,
        phone,
      ]
    );

    await client.query('COMMIT');
    transactionStarted = false;

    return res.status(201).json({
      appointment: {
        ...inserted.rows[0],
        final_price_cop: finalPriceCop,
        client_phone: phone,
      },
      final_price_cop: finalPriceCop,
    });
  } catch (err) {
    if (transactionStarted) {
      await client.query('ROLLBACK').catch(() => {});
    }

    console.error('Error creando cita', err);
    return res.status(500).json({
      error: 'No se pudo crear la cita',
    });
  } finally {
    client.release();
  }
});

router.get('/mine', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*,
              p.name AS pet_name,
              s.name AS service_name,
              s.price_cop,
              COALESCE(a.client_phone, u.phone) AS contact_phone,
              CASE
                WHEN a.status = 'pending'
                  AND (a.appointment_date + a.end_time) <=
                      (NOW() AT TIME ZONE 'America/Bogota')
                THEN 'past'
                ELSE a.status
              END AS display_status
       FROM appointments a
       JOIN pets p ON p.id = a.pet_id
       JOIN services s ON s.id = a.service_id
       JOIN users u ON u.id = a.client_id
       WHERE a.client_id = $1
       ORDER BY a.appointment_date DESC, a.start_time DESC`,
      [req.user.id]
    );

    return res.json({ appointments: result.rows });
  } catch (err) {
    console.error('Error cargando citas del cliente', err);
    return res.status(500).json({
      error: 'No se pudieron cargar las citas',
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const appointmentRes = await pool.query(
      `SELECT *
       FROM appointments
       WHERE id = $1 AND client_id = $2`,
      [req.params.id, req.user.id]
    );

    const appointment = appointmentRes.rows[0];

    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    if (appointment.status !== 'pending') {
      return res.status(409).json({
        error: 'Solo se pueden cancelar citas pendientes.',
      });
    }

    if (hasAppointmentPassed(appointment)) {
      return res.status(409).json({
        error: 'La cita ya pasó y no se puede cancelar.',
      });
    }

    if (!canCancelAppointment(appointment)) {
      return res.status(409).json({
        error: 'La cancelación debe hacerse con al menos 4 horas de anticipación.',
      });
    }

    const result = await pool.query(
      `UPDATE appointments
       SET status = 'cancelled'
       WHERE id = $1 AND client_id = $2
       RETURNING *`,
      [req.params.id, req.user.id]
    );

    return res.json({ appointment: result.rows[0] });
  } catch (err) {
    console.error('Error cancelando cita', err);
    return res.status(500).json({
      error: 'No se pudo cancelar la cita',
    });
  }
});

module.exports = router;