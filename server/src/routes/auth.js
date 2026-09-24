const express = require('express');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// El cliente llama esto justo después de iniciar sesión con Firebase.
// requireAuth ya se encarga de crear la fila en `users` si es la primera vez.
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
