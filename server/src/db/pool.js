const { Pool } = require('pg');

// DATABASE_URL, ej: postgres://usuario:password@host:5432/nombre_bd
// En proveedores como Neon/Render/Railway normalmente ya viene con sslmode=require.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL', err);
});

module.exports = pool;
