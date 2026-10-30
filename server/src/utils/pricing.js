const PET_SIZE_PRICE_MULTIPLIER = {
  pequeño: 1,
  mediano: 1.2,
  grande: 1.5,
};

function calculateServicePrice(basePriceCop, petSize) {
  const multiplier = PET_SIZE_PRICE_MULTIPLIER[petSize] ?? 1;
  return Math.round(Number(basePriceCop) * multiplier);
}

module.exports = {
  PET_SIZE_PRICE_MULTIPLIER,
  calculateServicePrice,
};