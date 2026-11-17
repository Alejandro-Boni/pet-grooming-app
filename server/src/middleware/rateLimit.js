// Limitador de peticiones por ventana de tiempo, en memoria y sin dependencias.
// Se usa DESPUÉS de requireAuth para limitar por usuario (req.user.id); si no hay usuario,
// cae a la IP. Al superar el máximo responde 429 con el header Retry-After.
function createRateLimiter({
  windowMs = 60 * 1000,
  max = 30,
  message = 'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.',
  keyFn = (req) => (req.user?.id !== undefined ? `user:${req.user.id}` : `ip:${req.ip}`),
  now = Date.now,
} = {}) {
  const buckets = new Map(); // clave → { count, resetAt }

  // Limpieza periódica para que el mapa no crezca sin límite. unref(): no impide que el
  // proceso termine (importante para los tests).
  const sweep = setInterval(() => {
    const t = now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= t) buckets.delete(key);
    }
  }, Math.max(windowMs, 1000));
  sweep.unref?.();

  return function rateLimit(req, res, next) {
    const key = keyFn(req);
    const t = now();
    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= t) {
      bucket = { count: 0, resetAt: t + windowMs };
      buckets.set(key, bucket);
    }

    if (bucket.count >= max) {
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil((bucket.resetAt - t) / 1000))));
      return res.status(429).json({ error: message });
    }

    bucket.count += 1;
    return next();
  };
}

// Límites por usuario y por minuto. Holgados para uso normal (recorrer los 14 días del
// calendario son 14 consultas) pero frenan scripts o clics frenéticos que gastan la cuota.
const availabilityLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Demasiadas consultas de horarios en poco tiempo. Espera unos segundos e inténtalo de nuevo.',
});

const geocodeLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Demasiadas búsquedas de dirección en poco tiempo. Espera un momento e inténtalo de nuevo.',
});

module.exports = { createRateLimiter, availabilityLimiter, geocodeLimiter };
