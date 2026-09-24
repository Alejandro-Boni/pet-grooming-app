import PetAlerts from './PetAlerts';

export default function PetCard({ pet, selected, onSelect, onEdit, onDelete }) {
  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        selected ? 'border-ochre bg-ochre/5' : 'border-sage/50 bg-cream'
      }`}
    >
      <button type="button" onClick={() => onSelect?.(pet)} className="w-full text-left">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg text-ink">{pet.name}</h3>
          <span className="text-xs uppercase tracking-wide text-ink/40">{pet.species}</span>
        </div>
        <p className="mt-1 text-sm text-ink/60">
          {pet.breed || 'Raza mixta'} · {pet.size} · {pet.age_years ? `${pet.age_years} años` : 'edad no registrada'}
        </p>
        <PetAlerts pet={pet} />
      </button>
      {(onEdit || onDelete) && (
        <div className="mt-3 flex gap-3 text-xs">
          {onEdit && (
            <button onClick={() => onEdit(pet)} className="text-pine underline underline-offset-2">
              Editar ficha
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(pet)} className="text-clay underline underline-offset-2">
              Eliminar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
