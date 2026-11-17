// Configuración de CORS a partir de CLIENT_ORIGIN (uno o varios orígenes separados por coma,
// ej: "https://mi-app.vercel.app,https://www.mi-dominio.com").
//  - Sin CLIENT_ORIGIN: se permite cualquier origen (como hasta ahora; cómodo en local).
//  - Con CLIENT_ORIGIN: solo esos orígenes. Las peticiones sin cabecera Origin (health
//    checks, curl, herramientas de servidor) siguen funcionando: CORS solo protege al navegador.
const normalize = (origin) => String(origin).trim().replace(/\/+$/, '').toLowerCase();

function parseAllowedOrigins(value) {
  return String(value || '')
    .split(',')
    .map(normalize)
    .filter(Boolean);
}

function buildCorsOptions(clientOriginEnv) {
  const allowed = parseAllowedOrigins(clientOriginEnv);

  if (allowed.length === 0) return { options: {}, restricted: false };

  return {
    restricted: true,
    allowed,
    options: {
      origin(origin, callback) {
        callback(null, !origin || allowed.includes(normalize(origin)));
      },
    },
  };
}

module.exports = { buildCorsOptions, parseAllowedOrigins };
