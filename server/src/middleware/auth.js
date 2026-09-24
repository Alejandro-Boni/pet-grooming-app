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
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Falta el token de autenticación' });

    const decoded = await admin.auth().verifyIdToken(token);

    const existing = await pool.query('SELECT * FROM users WHERE firebase_uid = $1', [decoded.uid]);
    let user = existing.rows[0];

    if (!user) {
      const inserted = await pool.query(
        `INSERT INTO users (firebase_uid, name, email, phone, role)
         VALUES ($1, $2, $3, $4, 'client') RETURNING *`,
        [decoded.uid, decoded.name || null, decoded.email || null, decoded.phone_number || null]
      );
      user = inserted.rows[0];
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
    console.error('Error verificando token', err);
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = { requireAuth };
