// Uso: node src/db/makeAdmin.js correo@ejemplo.com
// El usuario debe haber iniciado sesión al menos una vez en el módulo del cliente
// (así ya existe su fila en `users`, creada automáticamente por el middleware de auth).
require('dotenv').config();
const pool = require('./pool');

async function makeAdmin() {
  const email = process.argv[2];
  if (!email) {
    console.error('Uso: node src/db/makeAdmin.js correo@ejemplo.com');
    process.exit(1);
  }
  const result = await pool.query("UPDATE users SET role = 'admin' WHERE email = $1 RETURNING *", [email]);
  if (!result.rows[0]) {
    console.error('No se encontró ningún usuario con ese correo. Debe iniciar sesión al menos una vez primero.');
  } else {
    console.log(`${email} ahora es administrador.`);
  }
  await pool.end();
}

makeAdmin();
