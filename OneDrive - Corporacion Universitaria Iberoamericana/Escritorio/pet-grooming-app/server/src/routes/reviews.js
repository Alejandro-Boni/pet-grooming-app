const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [reviewsResult, summaryResult] = await Promise.all([
      pool.query(
        `SELECT r.id, r.rating, r.comment, r.created_at, s.name AS service_name
         FROM reviews r
         JOIN appointments a ON a.id = r.appointment_id
         JOIN services s ON s.id = a.service_id
         WHERE r.is_visible = true
         ORDER BY r.created_at DESC
         LIMIT 50`
      ),
      pool.query(
        `SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0) AS average_rating,
                COUNT(*) AS total_reviews
         FROM reviews
         WHERE is_visible = true`
      ),
    ]);

    return res.json({
      reviews: reviewsResult.rows,
      average_rating: Number(summaryResult.rows[0].average_rating || 0),
      total_reviews: Number(summaryResult.rows[0].total_reviews || 0),
    });
  } catch (err) {
    console.error('Error cargando reseñas públicas', err);
    return res.status(500).json({ error: 'No se pudieron cargar las reseñas.' });
  }
});

module.exports = router;
