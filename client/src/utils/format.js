const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

/** Formatea un precio en pesos colombianos, ej. 45000 → "$45.000". */
export function formatPrice(priceCop) {
  if (priceCop === null || priceCop === undefined) return null;
  return copFormatter.format(priceCop);
}

/** 'HH:MM:SS' (como llega de PostgreSQL) → 'HH:MM'. */
export function formatTime(time) {
  return time ? String(time).slice(0, 5) : '';
}

/** 'AAAA-MM-DD' → "lunes 21 de septiembre". Se ancla a mediodía para evitar saltos de zona horaria. */
export function formatDate(dateKey) {
  if (!dateKey) return '';
  const date = new Date(`${String(dateKey).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return String(dateKey);
  return date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
}
