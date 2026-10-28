import { useState } from 'react';

const EMPTY_PET = {
  name: '',
  species: 'perro',
  breed: '',
  ageYears: '',
  weightKg: '',
  size: 'mediano',
  isReactive: false,
  isAllergic: false,
  allergyNotes: '',
  isGeriatric: false,
  medicalConditions: '',
};

export default function PetForm({ initialPet, onSubmit, onCancel, isSaving }) {
  const [pet, setPet] = useState(() =>
    initialPet
      ? {
          name: initialPet.name,
          species: initialPet.species,
          breed: initialPet.breed || '',
          ageYears: initialPet.age_years || '',
          weightKg: initialPet.weight_kg || '',
          size: initialPet.size,
          isReactive: initialPet.is_reactive,
          isAllergic: initialPet.is_allergic,
          allergyNotes: initialPet.allergy_notes || '',
          isGeriatric: initialPet.is_geriatric,
          medicalConditions: initialPet.medical_conditions || '',
        }
      : EMPTY_PET
  );

  function update(field, value) {
    setPet((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(pet);
      }}
      className="space-y-5 text-white"
    >
      <div className="grid grid-cols-2 gap-3">
        <label className="col-span-2 text-sm text-[#F1E5C5]">
          Nombre
          <input
            required
            value={pet.name}
            onChange={(e) => update('name', e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#D4AF37]/30 bg-[#0F0F0F] px-3 py-2 text-white placeholder:text-[#F1E5C5]/60 focus:border-[#E5C158] focus:outline-none"
          />
        </label>

        <label className="text-sm text-[#F1E5C5]">
          Especie
          <select
            value={pet.species}
            onChange={(e) => update('species', e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#D4AF37]/30 bg-[#0F0F0F] px-3 py-2 text-white focus:border-[#E5C158] focus:outline-none"
          >
            <option value="perro">Perro</option>
            <option value="gato">Gato</option>
          </select>
        </label>

        <label className="text-sm text-[#F1E5C5]">
          Tamaño
          <select
            value={pet.size}
            onChange={(e) => update('size', e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#D4AF37]/30 bg-[#0F0F0F] px-3 py-2 text-white focus:border-[#E5C158] focus:outline-none"
          >
            <option value="pequeño">Pequeño</option>
            <option value="mediano">Mediano</option>
            <option value="grande">Grande</option>
          </select>
        </label>

        <label className="text-sm text-[#F1E5C5]">
          Raza
          <input
            value={pet.breed}
            onChange={(e) => update('breed', e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#D4AF37]/30 bg-[#0F0F0F] px-3 py-2 text-white placeholder:text-[#F1E5C5]/60 focus:border-[#E5C158] focus:outline-none"
          />
        </label>

        <label className="text-sm text-[#F1E5C5]">
          Edad (años)
          <input
            type="number"
            min="0"
            step="0.5"
            value={pet.ageYears}
            onChange={(e) => update('ageYears', e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#D4AF37]/30 bg-[#0F0F0F] px-3 py-2 text-white placeholder:text-[#F1E5C5]/60 focus:border-[#E5C158] focus:outline-none"
          />
        </label>

        <label className="text-sm text-[#F1E5C5]">
          Peso aproximado (kg)
          <input
            type="number"
            min="0"
            step="0.1"
            value={pet.weightKg}
            onChange={(e) => update('weightKg', e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#D4AF37]/30 bg-[#0F0F0F] px-3 py-2 text-white placeholder:text-[#F1E5C5]/60 focus:border-[#E5C158] focus:outline-none"
          />
        </label>
      </div>

      <fieldset className="rounded-2xl border border-[#D4AF37]/30 p-3">
        <legend className="px-1 text-sm font-medium text-[#E5C158]">
          Ficha de comportamiento y salud
        </legend>

        <div className="mt-3 space-y-3">
          <label className="flex items-center gap-2 text-sm text-[#F1E5C5]">
            <input
              type="checkbox"
              checked={pet.isReactive}
              onChange={(e) => update('isReactive', e.target.checked)}
            />
            Es reactivo o se pone nervioso fácilmente
          </label>

          <label className="flex items-center gap-2 text-sm text-[#F1E5C5]">
            <input
              type="checkbox"
              checked={pet.isAllergic}
              onChange={(e) => update('isAllergic', e.target.checked)}
            />
            Es alérgico a algún insumo
          </label>

          {pet.isAllergic && (
            <input
              placeholder="¿A qué producto? (ej. shampoo con sulfatos)"
              value={pet.allergyNotes}
              onChange={(e) => update('allergyNotes', e.target.value)}
              className="w-full rounded-xl border border-[#D4AF37]/30 bg-[#0F0F0F] px-3 py-2 text-sm text-white placeholder:text-[#F1E5C5]/60 focus:border-[#E5C158] focus:outline-none"
            />
          )}

          <label className="flex items-center gap-2 text-sm text-[#F1E5C5]">
            <input
              type="checkbox"
              checked={pet.isGeriatric}
              onChange={(e) => update('isGeriatric', e.target.checked)}
            />
            Es un paciente geriátrico
          </label>

          <label className="block text-sm text-[#F1E5C5]">
            Condición médica activa (opcional)
            <textarea
              value={pet.medicalConditions}
              onChange={(e) => update('medicalConditions', e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-xl border border-[#D4AF37]/30 bg-[#0F0F0F] px-3 py-2 text-sm text-white placeholder:text-[#F1E5C5]/60 focus:border-[#E5C158] focus:outline-none"
            />
          </label>
        </div>
      </fieldset>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-[#D4AF37]/30 px-4 py-2 text-sm text-[#F1E5C5] hover:text-white"
          >
            Cancelar
          </button>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="gold-button px-5 py-2 text-sm disabled:opacity-60"
        >
          {isSaving ? 'Guardando…' : 'Guardar ficha'}
        </button>
      </div>
    </form>
  );
}