const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// Listar las mascotas del cliente autenticado
router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM pets WHERE owner_id = $1 ORDER BY created_at', [req.user.id]);
  res.json({ pets: result.rows });
});

// Crear una mascota nueva con su ficha de comportamiento y salud
router.post('/', async (req, res) => {
  const {
    name, species, breed, ageYears, weightKg, size,
    isReactive, isAllergic, allergyNotes, isGeriatric, medicalConditions,
  } = req.body;

  if (!name || !species || !size) {
    return res.status(400).json({ error: 'Nombre, especie y tamaño son obligatorios' });
  }

  const result = await pool.query(
    `INSERT INTO pets
      (owner_id, name, species, breed, age_years, weight_kg, size,
       is_reactive, is_allergic, allergy_notes, is_geriatric, medical_conditions)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [req.user.id, name, species, breed || null, ageYears || null, weightKg || null, size,
     !!isReactive, !!isAllergic, allergyNotes || null, !!isGeriatric, medicalConditions || null]
  );
  res.status(201).json({ pet: result.rows[0] });
});

// Editar una mascota propia
router.put('/:id', async (req, res) => {
  const owned = await pool.query('SELECT id FROM pets WHERE id = $1 AND owner_id = $2', [req.params.id, req.user.id]);
  if (!owned.rows[0]) return res.status(404).json({ error: 'Mascota no encontrada' });

  const {
    name, species, breed, ageYears, weightKg, size,
    isReactive, isAllergic, allergyNotes, isGeriatric, medicalConditions,
  } = req.body;

  const result = await pool.query(
    `UPDATE pets SET name=$1, species=$2, breed=$3, age_years=$4, weight_kg=$5, size=$6,
       is_reactive=$7, is_allergic=$8, allergy_notes=$9, is_geriatric=$10, medical_conditions=$11
     WHERE id = $12 RETURNING *`,
    [name, species, breed || null, ageYears || null, weightKg || null, size,
     !!isReactive, !!isAllergic, allergyNotes || null, !!isGeriatric, medicalConditions || null,
     req.params.id]
  );
  res.json({ pet: result.rows[0] });
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM pets WHERE id = $1 AND owner_id = $2', [req.params.id, req.user.id]);
  res.status(204).end();
});

module.exports = router;
