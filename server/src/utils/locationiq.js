// Geocodificación de direcciones con LocationIQ (datos de OpenStreetMap).
// Se eligió sobre TomTom específicamente para este paso porque su cobertura de
// direcciones en Bogotá y alrededores (basada en OpenStreetMap) resulta más precisa.
// TomTom se sigue usando para el cálculo de tiempo de traslado con tráfico.
// Requiere Node 18+ (usa el fetch nativo, sin dependencias extra).
//
// Las direcciones ya resueltas se guardan 24 h en memoria (una misma dirección se repite
// mucho: el cliente corrige, vuelve atrás, reserva otra mascota...) y cada consulta tiene
// un timeout (LOCATIONIQ_TIMEOUT_MS, 5 s por defecto). Los errores y las direcciones no encontradas no se guardan.
const { createTtlCache } = require('./ttl-cache');

const LOCATIONIQ_TIMEOUT_MS = Number(process.env.LOCATIONIQ_TIMEOUT_MS) || 5000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const normalizeAddress = (address) => address.trim().toLowerCase().replace(/\s+/g, ' ');

function createGeocoder({
  fetchImpl = (...args) => fetch(...args),
  getApiKey = () => process.env.LOCATIONIQ_API_KEY,
  cache = createTtlCache({ maxEntries: 2000 }),
  timeoutMs = LOCATIONIQ_TIMEOUT_MS,
  logger = console,
} = {}) {
  async function fetchGeocode(address, apiKey) {
    const url =
      `https://us1.locationiq.com/v1/search?key=${apiKey}` +
      `&q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=co`;

    let res;
    try {
      res = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs) });
    } catch (err) {
      if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
        throw new Error('El servicio de direcciones tardó demasiado. Intenta de nuevo.');
      }
      logger.error('LocationIQ no respondió', err?.message);
      throw new Error('No se pudo consultar el servicio de direcciones. Intenta de nuevo en un momento.');
    }

    if (!res.ok) {
      logger.error(`LocationIQ geocode respondió ${res.status}`);
      throw new Error('No se pudo consultar el servicio de direcciones. Intenta de nuevo en un momento.');
    }

    const data = await res.json();
    const top = Array.isArray(data) ? data[0] : null;
    if (!top) throw new Error('No se encontró esa dirección. Intenta ser más específico (calle, número, ciudad).');

    return {
      lat: Number(top.lat),
      lng: Number(top.lon),
      formattedAddress: top.display_name || address,
    };
  }

  /**
   * Convierte una dirección de texto en coordenadas usando la API de Forward Geocoding de
   * LocationIQ (compatible con Nominatim/OpenStreetMap). Se restringe a Colombia
   * (`countrycodes=co`) para evitar falsos positivos con nombres de calle ambiguos.
   */
  async function geocodeAddress(address) {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error('Falta configurar LOCATIONIQ_API_KEY en las variables de entorno del servidor');
    }

    // Se devuelve una copia para que nadie pueda mutar lo que está en la caché.
    const result = await cache.getOrLoad(normalizeAddress(address), CACHE_TTL_MS, () =>
      fetchGeocode(address, apiKey)
    );
    return { ...result };
  }

  return { geocodeAddress, cache };
}

const defaultGeocoder = createGeocoder();

module.exports = {
  geocodeAddress: defaultGeocoder.geocodeAddress,
  createGeocoder,
  normalizeAddress,
  CACHE_TTL_MS,
};
