require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./pool');

// Aplica schema.sql (solo estructura, idempotente) y luego cada archivo de migrations/ en orden
// alfabético, registrando en `schema_migrations` los que ya se aplicaron para no repetirlos.
// Al final carga seed.sql únicamente si la base está vacía.
async function migrate() {
  const client = await pool.connect();

  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schemaSql);
    console.log('Esquema base aplicado.');

    await client.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         name TEXT PRIMARY KEY,
         applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
       )`
    );

    const dir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

    for (const file of files) {
      const done = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [file]);
      if (done.rowCount > 0) {
        console.log(`Migración ${file}: ya aplicada.`);
        continue;
      }

      const sql = fs.readFileSync(path.join(dir, file), 'utf8');
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`Migración ${file}: aplicada.`);
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw new Error(`Falló la migración ${file}: ${err.message}`);
      }
    }

    // Datos de ejemplo solo en una base vacía: en una base que ya tiene su catálogo real,
    // volver a insertarlos añadiría servicios de ejemplo que no son tuyos.
    const { rows } = await client.query('SELECT count(*)::int AS n FROM services');
    if (rows[0].n === 0) {
      const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
      await client.query(seedSql);
      console.log('Base vacía: se cargaron los datos iniciales (seed.sql).');
    } else {
      console.log('La base ya tiene servicios: no se vuelven a cargar los datos iniciales.');
    }
  } finally {
    client.release();
  }

  await pool.end();
}

migrate().catch((err) => {
  console.error('Error aplicando el esquema:', err);
  process.exit(1);
});
