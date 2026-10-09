// Utilidades para hablar con TomTom — tiempo de traslado con tráfico en vivo.
// La geocodificación de direcciones ahora vive en utils/locationiq.js (mejor
// cobertura en Bogotá); TomTom se queda encargado solo del cálculo de ruta.
// Requiere Node 18+ (usa el fetch nativo, sin dependencias extra).

const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;

function assertApiKey() {
  if (!TOMTOM_API_KEY) {
    throw new Error('Falta configurar TOMTOM_API_KEY en las variables de entorno del servidor');
  }
}

/**
 * Minutos de traslado en auto entre dos coordenadas, considerando tráfico. `departAt` es un
 * ISO 8601 (fecha+hora local con offset) del momento aproximado del trayecto — TomTom usa su
 * modelo de tráfico en vivo/predictivo según qué tan cerca esté esa hora del presente.
 */
async function getTravelMinutes(from, to, departAt) {
  assertApiKey();
  const url =
    `https://api.tomtom.com/routing/1/calculateRoute/${from.lat},${from.lng}:${to.lat},${to.lng}/json` +
    `?key=${TOMTOM_API_KEY}&traffic=true&departAt=${encodeURIComponent(departAt)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`TomTom routing respondió ${res.status}`);
  const data = await res.json();

  const seconds = data.routes?.[0]?.summary?.travelTimeInSeconds;
  if (seconds === undefined) throw new Error('TomTom no devolvió una ruta entre esos dos puntos');

  return Math.ceil(seconds / 60);
}

module.exports = { getTravelMinutes };