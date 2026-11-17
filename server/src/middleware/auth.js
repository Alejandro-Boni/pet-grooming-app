const admin = require('firebase-admin');
const pool = require('../db/pool');

if (!admin.apps.length) {
  // FIREBASE_SERVICE_ACCOUNT debe contener el JSON completo de la cuenta de servicio
  // (Firebase Console → Configuración del proyecto → Cuentas de servicio → Generar clave privada)
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

/**
 * Verifica el ID token de Firebase enviado en el header Authorization: Bearer <token>.
 * Si el usuario no existe todavía en la tabla `users`, lo crea con rol 'client'.
 * Adjunta req.user = { id, role, firebaseUid, email, phone }.
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Falta el token de autenticación' });

  // Solo un token inválido o vencido es un 401. Un fallo de base de datos es un 500
  // (antes se reportaba como "Token inválido" y confundía el diagnóstico).
  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(token);
  } catch (err) {
    console.error('Error verificando token', err);
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  try {
    let user = (await pool.query('SELECT * FROM users WHERE firebase_uid = $1', [decoded.uid])).rows[0];

    if (!user) {
      // En el primer login llegan varias peticiones casi a la vez (/auth/me, /pets, ...).
      // ON CONFLICT DO NOTHING evita que la segunda falle contra el UNIQUE de firebase_uid;
      // si otra petición ganó la carrera, simplemente leemos la fila que ya creó.
      const inserted = await pool.query(
        `INSERT INTO users (firebase_uid, name, email, phone, role)
         VALUES ($1, $2, $3, $4, 'client')
         ON CONFLICT (firebase_uid) DO NOTHING
         RETURNING *`,
        [decoded.uid, decoded.name || null, decoded.email || null, decoded.phone_number || null]
      );
      user =
        inserted.rows[0] ||
        (await pool.query('SELECT * FROM users WHERE firebase_uid = $1', [decoded.uid])).rows[0];
    }

    req.user = {
      id: user.id,
      role: user.role,
      firebaseUid: user.firebase_uid,
      email: user.email,
      phone: user.phone,
      name: user.name,
    };
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireAuth };
