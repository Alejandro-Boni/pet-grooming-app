// Utilidades para hablar con TomTom (geocodificación + tiempo de traslado con tráfico).
// Requiere Node 18+ (usa el fetch nativo, sin dependencias extra).

const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;

function assertApiKey() {
  if (!TOMTOM_API_KEY) {
    throw new Error('Falta configurar TOMTOM_API_KEY en las variables de entorno del servidor');
  }
}

/**
 * Convierte una dirección de texto en coordenadas usando el endpoint de Geocode de TomTom
 * (pensado para direcciones completas enviadas por una aplicación, a diferencia de Fuzzy
 * Search que es para autocompletar mientras alguien escribe).
 */
async function geocodeAddress(address) {
  assertApiKey();
  const url = `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(address)}.json?key=${TOMTOM_API_KEY}&limit=1`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`TomTom geocode respondió ${res.status}`);
  const data = await res.json();

  const top = data.results?.[0];
  if (!top) throw new Error('No se encontró esa dirección. Intenta ser más específico (calle, número, ciudad).');

  return {
    lat: top.position.lat,
    lng: top.position.lon,
    formattedAddress: top.address?.freeformAddress || address,
  };
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

module.exports = { geocodeAddress, getTravelMinutes };
