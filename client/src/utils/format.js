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
