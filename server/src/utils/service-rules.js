const DOG_SIZE_IN_SERVICE_NAME = /\bperro (pequeño|mediano|grande|gigante)\b/i;
const DOG_SERVICE = /\bperro\b/i;
const CAT_SERVICE = /\bgato\b/i;

function isServiceAvailableForPet(service, pet) {
  const serviceName = service.name;
  const dogSizeMatch = serviceName.match(DOG_SIZE_IN_SERVICE_NAME);

  if (pet.species === 'perro') {
    if (CAT_SERVICE.test(serviceName)) return false;
    return !dogSizeMatch || dogSizeMatch[1].toLowerCase() === pet.size;
  }

  if (pet.species === 'gato') {
    return !DOG_SERVICE.test(serviceName);
  }

  return false;
}

function hasSizeSpecificPrice(serviceName) {
  return DOG_SIZE_IN_SERVICE_NAME.test(serviceName) || CAT_SERVICE.test(serviceName);
}

module.exports = { isServiceAvailableForPet, hasSizeSpecificPrice };
