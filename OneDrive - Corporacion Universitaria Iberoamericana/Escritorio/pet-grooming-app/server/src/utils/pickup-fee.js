const PICKUP_GRACE_MINUTES = 15;
const PICKUP_FEE_BLOCK_MINUTES = 15;
const PICKUP_FEE_PER_BLOCK_COP = 5000;

function calculateLatePickupFee(serviceFinishedAt, pickedUpAt) {
  if (serviceFinishedAt == null) return 0;

  const finishedTime = new Date(serviceFinishedAt).getTime();
  const pickupTime = new Date(pickedUpAt).getTime();
  if (!Number.isFinite(finishedTime) || !Number.isFinite(pickupTime)) {
    throw new TypeError('Las fechas de finalización y recogida deben ser válidas.');
  }

  const graceMs = PICKUP_GRACE_MINUTES * 60 * 1000;
  const blockMs = PICKUP_FEE_BLOCK_MINUTES * 60 * 1000;
  const overdueMs = pickupTime - finishedTime - graceMs;
  if (overdueMs <= 0) return 0;

  return Math.ceil(overdueMs / blockMs) * PICKUP_FEE_PER_BLOCK_COP;
}

module.exports = {
  PICKUP_GRACE_MINUTES,
  PICKUP_FEE_BLOCK_MINUTES,
  PICKUP_FEE_PER_BLOCK_COP,
  calculateLatePickupFee,
};
