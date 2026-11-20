import PetAlerts from './PetAlerts';

export default function PetCard({ pet, selected, onSelect, onEdit, onDelete }) {
  return (
    <div
      className={`bento-card-hover ${
        selected
          ? 'border-[#E5C158] bg-[#D4AF37]/10'
          : 'border-[#D4AF37]/30 bg-[#111111]'
      }`}
    >
      <button type="button" onClick={() => onSelect?.(pet)} className="w-full text-left">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg text-white">{pet.name}</h3>
          <span className="text-xs uppercase tracking-wide text-[#E5C158]">{pet.species}</span>
        </div>
        <p className="mt-1 text-sm text-[#F1E5C5]/75">
          {pet.breed || 'Raza mixta'} · {pet.size} · {pet.age_years ? `${pet.age_years} años` : 'edad no registrada'}
        </p>
        <PetAlerts pet={pet} />
      </button>
      {(onEdit || onDelete) && (
        <div className="mt-3 flex gap-3 text-xs">
          {onEdit && (
            <button onClick={() => onEdit(pet)} className="text-[#E5C158] underline underline-offset-2">
              Editar ficha
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(pet)} className="text-red-300 underline underline-offset-2">
              Eliminar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
