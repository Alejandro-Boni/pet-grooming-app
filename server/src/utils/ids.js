// Los ids de la base son INTEGER (máx. 2147483647). Un id mal formado ("abc", "1e3",
// "99999999999") llegaba hasta PostgreSQL y terminaba en un 500; así se rechaza antes con 400.
const MAX_INT4 = 2147483647;

function parseId(value) {
  if (typeof value === 'number' ? false : typeof value !== 'string') return null;
  if (typeof value === 'string' && !/^\d+$/.test(value.trim())) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 && id <= MAX_INT4 ? id : null;
}

module.exports = { parseId, MAX_INT4 };
