function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso restringido al equipo administrador' });
  }
  next();
}

module.exports = { requireAdmin };
