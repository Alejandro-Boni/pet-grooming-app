const { Pool, types } = require('pg');

// Por defecto `pg` convierte las columnas DATE (OID 1082) en objetos Date a medianoche
// LOCAL del servidor, lo que rompe las comparaciones de fecha y las plantillas de texto
// (`${fecha}T09:00`) y las vuelve ISO con zona al serializar a JSON. Las dejamos como
// string 'AAAA-MM-DD', igual que las usa el resto del código y el frontend.
types.setTypeParser(1082, (value) => value);

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
