const SERVICE_AREA = Object.freeze({
  south: 4.45,
  north: 4.98,
  west: -74.32,
  east: -73.85,
});

const SERVICE_AREA_VIEWBOX =
  `${SERVICE_AREA.west},${SERVICE_AREA.north},${SERVICE_AREA.east},${SERVICE_AREA.south}`;

const SERVICE_AREA_ERROR =
  'Solo se pueden agendar servicios en Bogotá D.C. y sus municipios cercanos.';

function isInServiceArea(lat, lng) {
  const latitude = Number(lat);
  const longitude = Number(lng);

  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= SERVICE_AREA.south &&
    latitude <= SERVICE_AREA.north &&
    longitude >= SERVICE_AREA.west &&
    longitude <= SERVICE_AREA.east
  );
}

module.exports = {
  isInServiceArea,
  SERVICE_AREA_VIEWBOX,
  SERVICE_AREA_ERROR,
};
