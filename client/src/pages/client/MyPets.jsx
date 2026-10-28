import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import PetCard from '../../components/PetCard';
import PetForm from '../../components/PetForm';

export default function MyPets() {
  const [pets, setPets] = useState([]);
  const [editingPet, setEditingPet] = useState(undefined);
  const [isSaving, setIsSaving] = useState(false);

  function loadPets() {
    api.get('/api/pets').then((data) => setPets(data.pets));
  }

  useEffect(loadPets, []);

  async function handleSubmit(petData) {
    setIsSaving(true);
    try {
      if (editingPet?.id) await api.put(`/api/pets/${editingPet.id}`, petData);
      else await api.post('/api/pets', petData);

      setEditingPet(undefined);
      loadPets();
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(pet) {
    if (!confirm(`¿Eliminar la ficha de ${pet.name}?`)) return;
    await api.del(`/api/pets/${pet.id}`);
    loadPets();
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-white">Mis mascotas</h1>
        <button
          onClick={() => setEditingPet(null)}
          className="gold-button px-4 py-2 text-sm"
        >
          Añadir mascota
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {pets.map((pet) => (
          <PetCard key={pet.id} pet={pet} onEdit={setEditingPet} onDelete={handleDelete} />
        ))}

        {pets.length === 0 && (
          <p className="text-sm text-[#F1E5C5]">Aún no has registrado ninguna mascota.</p>
        )}
      </div>

      {editingPet !== undefined && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[28px] border border-[#D4AF37]/30 bg-[#111111] p-6 shadow-gold">
            <h2 className="font-display text-2xl text-white">
              {editingPet ? `Editar a ${editingPet.name}` : 'Nueva mascota'}
            </h2>

            <div className="mt-4">
              <PetForm
                initialPet={editingPet}
                isSaving={isSaving}
                onSubmit={handleSubmit}
                onCancel={() => setEditingPet(undefined)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}