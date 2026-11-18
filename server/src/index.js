require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { buildCorsOptions } = require('./utils/cors-options');

const authRoutes = require('./routes/auth');
const petRoutes = require('./routes/pets');
const serviceRoutes = require('./routes/services');
const availabilityRoutes = require('./routes/availability');
const appointmentRoutes = require('./routes/appointments');
const adminRoutes = require('./routes/admin');
const geocodeRoutes = require('./routes/geocode');
const reviewRoutes = require('./routes/reviews');

const app = express();
const corsConfig = buildCorsOptions(process.env.CLIENT_ORIGIN);
if (corsConfig.restricted) {
  console.log(`CORS restringido a: ${corsConfig.allowed.join(', ')}`);
} else {
  console.warn('CLIENT_ORIGIN no está definido: CORS permite cualquier origen. Defínelo en producción.');
}
app.use(cors(corsConfig.options));
// inflate:false rechaza con 415 los cuerpos comprimidos (Content-Encoding). Esta API solo recibe
// JSON plano desde el navegador y no necesita descomprimir nada. Así se cierra el aviso
// GHSA-27r3-jxmh-p828 (body-parser < 1.20.9: una sola petición con bytes sobrantes tras un
// cuerpo comprimido podía tumbar el proceso, sin autenticación). Se mantiene aunque se actualice.
app.use(express.json({ inflate: false }));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/reviews', reviewRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/geocode', geocodeRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API de la peluquería de mascotas escuchando en el puerto ${PORT}`));
