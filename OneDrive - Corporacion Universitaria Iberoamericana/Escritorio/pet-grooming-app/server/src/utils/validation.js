// Validaciones de entrada compartidas por las rutas. Son puras (sin base de datos) para
// poder probarlas; devuelven { error } con un mensaje en español, o { value } normalizado.
const PET_SPECIES = ['perro', 'gato'];
const PET_SIZES = ['pequeño', 'mediano', 'grande', 'gigante'];

const isBlank = (v) => v === undefined || v === null || v === '';

// Mantiene el comportamiento histórico: vacío (o 0) → null; si no, un número.
function optionalPositiveNumber(raw, { label, max }) {
  if (isBlank(raw)) return { value: null };
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > max) {
    return { error: `${label} no es válido.` };
  }
  return { value: n === 0 ? null : n };
}

function optionalText(raw, { label, max }) {
  if (isBlank(raw)) return { value: null };
  const text = String(raw).trim();
  if (text.length > max) return { error: `${label} no puede superar ${max} caracteres.` };
  return { value: text || null };
}

/** Valida el body de POST /api/pets y PUT /api/pets/:id. */
function validatePet(body = {}) {
  const { name, species, breed, ageYears, weightKg, size, allergyNotes, medicalConditions } = body;

  if (!name || !species || !size) {
    return { error: 'Nombre, especie y tamaño son obligatorios' };
  }

  const cleanName = String(name).trim();
  if (!cleanName) return { error: 'Nombre, especie y tamaño son obligatorios' };
  if (cleanName.length > 80) return { error: 'El nombre no puede superar 80 caracteres.' };
  if (!PET_SPECIES.includes(species)) return { error: 'La especie no es válida.' };
  if (!PET_SIZES.includes(size)) return { error: 'El tamaño no es válido.' };

  const breedRes = optionalText(breed, { label: 'La raza', max: 80 });
  if (breedRes.error) return breedRes;
  const age = optionalPositiveNumber(ageYears, { label: 'La edad', max: 40 });
  if (age.error) return age;
  const weight = optionalPositiveNumber(weightKg, { label: 'El peso', max: 150 });
  if (weight.error) return weight;
  const allergy = optionalText(allergyNotes, { label: 'Las notas de alergias', max: 1000 });
  if (allergy.error) return allergy;
  const medical = optionalText(medicalConditions, { label: 'Las condiciones médicas', max: 1000 });
  if (medical.error) return medical;

  return {
    value: {
      name: cleanName,
      species,
      size,
      breed: breedRes.value,
      ageYears: age.value,
      weightKg: weight.value,
      allergyNotes: allergy.value,
      medicalConditions: medical.value,
      isReactive: !!body.isReactive,
      isAllergic: !!body.isAllergic,
      isGeriatric: !!body.isGeriatric,
    },
  };
}

// Ajustes que el panel admin puede cambiar. Cualquier otra clave se rechaza: antes el
// endpoint creaba filas arbitrarias y un valor como "abc" en max_concurrent_pets dejaba
// las reservas sin límite (parseInt → NaN → la comparación nunca se cumple).
const SETTING_RULES = {
  max_concurrent_pets: { min: 1, max: 10, label: 'La cantidad de mascotas a la vez' },
};

function validateSetting(key, rawValue) {
  const rule = Object.prototype.hasOwnProperty.call(SETTING_RULES, key) ? SETTING_RULES[key] : null;
  if (!rule) return { error: 'Ese ajuste no existe.' };

  const text = typeof rawValue === 'number' ? String(rawValue) : typeof rawValue === 'string' ? rawValue.trim() : '';
  if (!/^\d+$/.test(text)) {
    return { error: `${rule.label} debe ser un número entero entre ${rule.min} y ${rule.max}.` };
  }
  const n = Number(text);
  if (n < rule.min || n > rule.max) {
    return { error: `${rule.label} debe ser un número entero entre ${rule.min} y ${rule.max}.` };
  }
  return { value: String(n) };
}

// Caja geográfica de Colombia (incluye San Andrés y Providencia). La geocodificación ya se
// restringe a Colombia; esto frena coordenadas absurdas enviadas directamente a la API.
const COLOMBIA_BOUNDS = { latMin: -4.3, latMax: 13.6, lngMin: -82, lngMax: -66.8 };

function validateCoords(lat, lng) {
  const bad = { error: 'La ubicación no es válida. Vuelve a buscar tu dirección.' };
  if (isBlank(lat) || isBlank(lng) || typeof lat === 'boolean' || typeof lng === 'boolean') return bad;

  const la = Number(lat);
  const lo = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return bad;
  if (la < COLOMBIA_BOUNDS.latMin || la > COLOMBIA_BOUNDS.latMax) return bad;
  if (lo < COLOMBIA_BOUNDS.lngMin || lo > COLOMBIA_BOUNDS.lngMax) return bad;

  return { value: { lat: la, lng: lo } };
}

module.exports = {
  PET_SPECIES,
  PET_SIZES,
  SETTING_RULES,
  COLOMBIA_BOUNDS,
  validatePet,
  validateSetting,
  validateCoords,
};
