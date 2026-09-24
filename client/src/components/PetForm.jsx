import { useState } from 'react';

const EMPTY_PET = {
  name: '', species: 'perro', breed: '', ageYears: '', weightKg: '', size: 'mediano',
  isReactive: false, isAllergic: false, allergyNotes: '', isGeriatric: false, medicalConditions: '',
};

export default function PetForm({ initialPet, onSubmit, onCancel, isSaving }) {
  const [pet, setPet] = useState(() =>
    initialPet
      ? {
          name: initialPet.name, species: initialPet.species, breed: initialPet.breed || '',
          ageYears: initialPet.age_years || '', weightKg: initialPet.weight_kg || '', size: initialPet.size,
          isReactive: initialPet.is_reactive, isAllergic: initialPet.is_allergic,
          allergyNotes: initialPet.allergy_notes || '', isGeriatric: initialPet.is_geriatric,
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
      className="space-y-5"
    >
      <div className="grid grid-cols-2 gap-3">
        <label className="col-span-2 text-sm text-ink/70">
          Nombre
          <input
            required
            value={pet.name}
            onChange={(e) => update('name', e.target.value)}
            className="mt-1 w-full rounded-lg border border-sage/60 bg-cream px-3 py-2 text-ink"
          />
        </label>
        <label className="text-sm text-ink/70">
          Especie
          <select
            value={pet.species}
            onChange={(e) => update('species', e.target.value)}
            className="mt-1 w-full rounded-lg border border-sage/60 bg-cream px-3 py-2 text-ink"
          >
            <option value="perro">Perro</option>
            <option value="gato">Gato</option>
          </select>
        </label>
        <label className="text-sm text-ink/70">
          Tamaño
          <select
            value={pet.size}
            onChange={(e) => update('size', e.target.value)}
            className="mt-1 w-full rounded-lg border border-sage/60 bg-cream px-3 py-2 text-ink"
          >
            <option value="pequeño">Pequeño</option>
            <option value="mediano">Mediano</option>
            <option value="grande">Grande</option>
          </select>
        </label>
        <label className="text-sm text-ink/70">
          Raza
          <input
            value={pet.breed}
            onChange={(e) => update('breed', e.target.value)}
            className="mt-1 w-full rounded-lg border border-sage/60 bg-cream px-3 py-2 text-ink"
          />
        </label>
        <label className="text-sm text-ink/70">
          Edad (años)
          <input
            type="number" min="0" step="0.5"
            value={pet.ageYears}
            onChange={(e) => update('ageYears', e.target.value)}
            className="mt-1 w-full rounded-lg border border-sage/60 bg-cream px-3 py-2 text-ink"
          />
        </label>
        <label className="text-sm text-ink/70">
          Peso aproximado (kg)
          <input
            type="number" min="0" step="0.1"
            value={pet.weightKg}
            onChange={(e) => update('weightKg', e.target.value)}
            className="mt-1 w-full rounded-lg border border-sage/60 bg-cream px-3 py-2 text-ink"
          />
        </label>
      </div>

      <fieldset className="rounded-lg border border-sage/50 p-3">
        <legend className="px-1 text-sm font-medium text-ink">Ficha de comportamiento y salud</legend>
        <div className="mt-2 space-y-3">
          <label className="flex items-center gap-2 text-sm text-ink/80">
            <input type="checkbox" checked={pet.isReactive} onChange={(e) => update('isReactive', e.target.checked)} />
            Es reactivo o se pone nervioso fácilmente
          </label>
          <label className="flex items-center gap-2 text-sm text-ink/80">
            <input type="checkbox" checked={pet.isAllergic} onChange={(e) => update('isAllergic', e.target.checked)} />
            Es alérgico a algún insumo
          </label>
          {pet.isAllergic && (
            <input
              placeholder="¿A qué producto? (ej. shampoo con sulfatos)"
              value={pet.allergyNotes}
              onChange={(e) => update('allergyNotes', e.target.value)}
              className="w-full rounded-lg border border-sage/60 bg-cream px-3 py-2 text-sm text-ink"
            />
          )}
          <label className="flex items-center gap-2 text-sm text-ink/80">
            <input type="checkbox" checked={pet.isGeriatric} onChange={(e) => update('isGeriatric', e.target.checked)} />
            Es un paciente geriátrico
          </label>
          <label className="block text-sm text-ink/70">
            Condición médica activa (opcional)
            <textarea
              value={pet.medicalConditions}
              onChange={(e) => update('medicalConditions', e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-sage/60 bg-cream px-3 py-2 text-sm text-ink"
            />
          </label>
        </div>
      </fieldset>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-full px-4 py-2 text-sm text-ink/60">
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-full bg-pine px-5 py-2 text-sm font-medium text-cream disabled:opacity-60"
        >
          {isSaving ? 'Guardando…' : 'Guardar ficha'}
        </button>
      </div>
    </form>
  );
}
