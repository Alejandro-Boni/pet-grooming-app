// Utilidades para hablar con TomTom — tiempo de traslado con tráfico en vivo.
// La geocodificación de direcciones ahora vive en utils/locationiq.js (mejor
// cobertura en Bogotá); TomTom se queda encargado solo del cálculo de ruta.
// Requiere Node 18+ (usa el fetch nativo, sin dependencias extra).
//
// Para cuidar la cuota gratuita (2.500 solicitudes/día) y no bloquear reservas:
//  - Caché: el mismo trayecto (coordenadas redondeadas a ~11 m) a la misma hora de salida
//    se consulta una sola vez. Hoy se guarda 30 min (el tráfico cambia); otros días, 6 h.
//  - Peticiones idénticas simultáneas comparten una sola llamada real.
//  - Máximo 3 llamadas simultáneas (el resto espera en cola).
//  - Timeout (TOMTOM_TIMEOUT_MS, 4 s por defecto): si TomTom no responde, se aborta y quien
//    llama usa su buffer conservador. Los errores no se guardan en la caché.
const { createTtlCache, createConcurrencyLimiter } = require('./ttl-cache');
const { nowInBogota } = require('./time');

// Si TomTom no responde a tiempo, se aborta y quien llama decide qué hacer (normalmente usar
// el buffer conservador). Sin esto, un TomTom lento deja colgada la reserva.
const TOMTOM_TIMEOUT_MS = Number(process.env.TOMTOM_TIMEOUT_MS) || 4000;

const TODAY_TTL_MS = 30 * 60 * 1000;
const FUTURE_TTL_MS = 6 * 60 * 60 * 1000;

function isValidCoord(point) {
  const lat = Number(point?.lat);
  const lng = Number(point?.lng);
  return (
    point?.lat !== null && point?.lat !== undefined &&
    point?.lng !== null && point?.lng !== undefined &&
    Number.isFinite(lat) && Number.isFinite(lng) &&
    Math.abs(lat) <= 90 && Math.abs(lng) <= 180
  );
}

// 4 decimales ≈ 11 m: suficiente para considerar "el mismo lugar".
const round = (n) => Number(n).toFixed(4);

function createTomTomClient({
  fetchImpl = (...args) => fetch(...args),
  getApiKey = () => process.env.TOMTOM_API_KEY,
  cache = createTtlCache({ maxEntries: 5000 }),
  timeoutMs = TOMTOM_TIMEOUT_MS,
  maxConcurrent = 3,
  now = () => new Date(),
  logger = console,
} = {}) {
  const limit = createConcurrencyLimiter(maxConcurrent);
  let realCalls = 0;

  function ttlFor(departAt) {
    const departDay = String(departAt).slice(0, 10);
    return departDay === nowInBogota(now()).date ? TODAY_TTL_MS : FUTURE_TTL_MS;
  }

  async function fetchTravelMinutes(from, to, departAt, apiKey) {
    const url =
      `https://api.tomtom.com/routing/1/calculateRoute/${from.lat},${from.lng}:${to.lat},${to.lng}/json` +
      `?key=${apiKey}&traffic=true&departAt=${encodeURIComponent(departAt)}`;

    let res;
    try {
      res = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs) });
    } catch (err) {
      if (err.name === 'TimeoutError') {
        throw new Error(`TomTom no respondió en ${timeoutMs} ms`);
      }
      throw err;
    }
    if (!res.ok) throw new Error(`TomTom routing respondió ${res.status}`);
    const data = await res.json();

    const seconds = data.routes?.[0]?.summary?.travelTimeInSeconds;
    if (seconds === undefined) throw new Error('TomTom no devolvió una ruta entre esos dos puntos');

    return Math.ceil(seconds / 60);
  }

  /**
   * Minutos de traslado en auto entre dos coordenadas, considerando tráfico. `departAt` es un
   * ISO 8601 (fecha+hora local con offset) del momento aproximado del trayecto — TomTom usa su
   * modelo de tráfico en vivo/predictivo según qué tan cerca esté esa hora del presente.
   */
  async function getTravelMinutes(from, to, departAt) {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error('Falta configurar TOMTOM_API_KEY en las variables de entorno del servidor');
    }
    // Coordenadas inválidas (NaN, fuera de rango) no deben gastar una llamada de la cuota.
    if (!isValidCoord(from) || !isValidCoord(to)) {
      throw new Error('Coordenadas inválidas para calcular el traslado');
    }

    const key = `${round(from.lat)},${round(from.lng)}>${round(to.lat)},${round(to.lng)}@${departAt}`;

    return cache.getOrLoad(key, ttlFor(departAt), () =>
      limit(async () => {
        realCalls += 1;
        const { hits, shared } = cache.stats();
        logger.info(
          `[tomtom] llamada real #${realCalls} desde que arrancó el servidor ` +
            `(aciertos de caché: ${hits}, compartidas: ${shared})`
        );
        return fetchTravelMinutes(from, to, departAt, apiKey);
      })
    );
  }

  return { getTravelMinutes, cache };
}

const defaultClient = createTomTomClient();

module.exports = {
  getTravelMinutes: defaultClient.getTravelMinutes,
  createTomTomClient,
  TODAY_TTL_MS,
  FUTURE_TTL_MS,
};
