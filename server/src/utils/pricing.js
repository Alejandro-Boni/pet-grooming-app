const { hasSizeSpecificPrice } = require('./service-rules');

const PET_SIZE_PRICE_MULTIPLIER = {
  pequeño: 1,
  mediano: 1.2,
  grande: 1.5,
  gigante: 1.5, // igual que 'grande' hasta definir la tarifa real
};

function calculateServicePrice(basePriceCop, petSize, serviceName) {
  if (serviceName && hasSizeSpecificPrice(serviceName)) {
    return Number(basePriceCop);
  }

  const multiplier = PET_SIZE_PRICE_MULTIPLIER[petSize] ?? 1;
  return Math.round(Number(basePriceCop) * multiplier);
}

module.exports = {
  PET_SIZE_PRICE_MULTIPLIER,
  calculateServicePrice,
};