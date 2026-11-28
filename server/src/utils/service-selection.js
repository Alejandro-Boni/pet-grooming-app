const { calculateDurationMinutes } = require('./duration');
const { calculateServicePrice } = require('./pricing');

function calculateServiceTotals(services, petSize) {
  return services.reduce(
    (totals, service) => ({
      finalPriceCop:
        totals.finalPriceCop +
        calculateServicePrice(service.price_cop, petSize, service.name),
      durationMinutes:
        totals.durationMinutes +
        calculateDurationMinutes(
          service.base_duration_minutes,
          petSize,
          service.name
        ),
    }),
    { finalPriceCop: 0, durationMinutes: 0 }
  );
}

module.exports = { calculateServiceTotals };
