// Geocodificación de direcciones con LocationIQ (datos de OpenStreetMap).
// Se eligió sobre TomTom específicamente para este paso porque su cobertura de
// direcciones en Bogotá y alrededores (basada en OpenStreetMap) resulta más precisa.
// TomTom se sigue usando para el cálculo de tiempo de traslado con tráfico 
// Requiere Node 18+ (usa el fetch nativo, sin dependencias extra).

const LOCATIONIQ_API_KEY = process.env.LOCATIONIQ_API_KEY;

function assertApiKey() {
  if (!LOCATIONIQ_API_KEY) {
    throw new Error('Falta configurar LOCATIONIQ_API_KEY en las variables de entorno del servidor');
  }
}

/**
 * Convierte una dirección de texto en coordenadas usando la API de Forward Geocoding de
 * LocationIQ (compatible con Nominatim/OpenStreetMap). Se restringe a Colombia
 * (`countrycodes=co`) para evitar falsos positivos con nombres de calle ambiguos.
 */
async function geocodeAddress(address) {
  assertApiKey();
  const url =
    `https://us1.locationiq.com/v1/search?key=${LOCATIONIQ_API_KEY}` +
    `&q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=co`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`LocationIQ geocode respondió ${res.status}`);
  const data = await res.json();

  const top = Array.isArray(data) ? data[0] : null;
  if (!top) throw new Error('No se encontró esa dirección. Intenta ser más específico (calle, número, ciudad).');

  return {
    lat: Number(top.lat),
    lng: Number(top.lon),
    formattedAddress: top.display_name || address,
  };
}

module.exports = { geocodeAddress };