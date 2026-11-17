const { asyncRouter } = require('../utils/asyncRouter');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { parseId } = require('../utils/ids');
const { validatePet } = require('../utils/validation');

const router = asyncRouter();
router.use(requireAuth);

// Listar las mascotas del cliente autenticado (las archivadas no aparecen)
router.get('/', async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM pets WHERE owner_id = $1 AND deleted_at IS NULL ORDER BY created_at',
    [req.user.id]
  );
  res.json({ pets: result.rows });
});

// Crear una mascota nueva con su ficha de comportamiento y salud
router.post('/', async (req, res) => {
  const { error, value: pet } = validatePet(req.body);
  if (error) return res.status(400).json({ error });

  const result = await pool.query(
    `INSERT INTO pets
      (owner_id, name, species, breed, age_years, weight_kg, size,
       is_reactive, is_allergic, allergy_notes, is_geriatric, medical_conditions)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [req.user.id, pet.name, pet.species, pet.breed, pet.ageYears, pet.weightKg, pet.size,
     pet.isReactive, pet.isAllergic, pet.allergyNotes, pet.isGeriatric, pet.medicalConditions]
  );
  res.status(201).json({ pet: result.rows[0] });
});

// Editar una mascota propia
router.put('/:id', async (req, res) => {
  const petId = parseId(req.params.id);
  if (!petId) return res.status(400).json({ error: 'La mascota indicada no es válida' });

  const owned = await pool.query(
    'SELECT id FROM pets WHERE id = $1 AND owner_id = $2 AND deleted_at IS NULL',
    [petId, req.user.id]
  );
  if (!owned.rows[0]) return res.status(404).json({ error: 'Mascota no encontrada' });

  const { error, value: pet } = validatePet(req.body);
  if (error) return res.status(400).json({ error });

  const result = await pool.query(
    `UPDATE pets SET name=$1, species=$2, breed=$3, age_years=$4, weight_kg=$5, size=$6,
       is_reactive=$7, is_allergic=$8, allergy_notes=$9, is_geriatric=$10, medical_conditions=$11
     WHERE id = $12 RETURNING *`,
    [pet.name, pet.species, pet.breed, pet.ageYears, pet.weightKg, pet.size,
     pet.isReactive, pet.isAllergic, pet.allergyNotes, pet.isGeriatric, pet.medicalConditions,
     petId]
  );
  res.json({ pet: result.rows[0] });
});

// Eliminar una mascota. Si nunca tuvo citas se borra de verdad; si ya tiene historial
// (citas, reseñas, recordatorios) solo se archiva: desaparece de la lista del cliente pero
// el historial del negocio se conserva. Antes el borrado en cascada eliminaba todo.
router.delete('/:id', async (req, res) => {
  const petId = parseId(req.params.id);
  if (!petId) return res.status(400).json({ error: 'La mascota indicada no es válida' });

  const archive = () =>
    pool.query(
      'UPDATE pets SET deleted_at = now() WHERE id = $1 AND owner_id = $2 AND deleted_at IS NULL',
      [petId, req.user.id]
    );

  const history = await pool.query('SELECT 1 FROM appointments WHERE pet_id = $1 LIMIT 1', [petId]);

  if (history.rowCount > 0) {
    await archive();
  } else {
    try {
      await pool.query('DELETE FROM pets WHERE id = $1 AND owner_id = $2', [petId, req.user.id]);
    } catch (err) {
      // 23503: justo apareció una cita entre la consulta y el borrado → se archiva.
      if (err.code !== '23503') throw err;
      await archive();
    }
  }

  res.status(204).end();
});

module.exports = router;
