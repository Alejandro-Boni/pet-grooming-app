import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import PetCard from '../../components/PetCard';
import PetForm from '../../components/PetForm';

export default function MyPets() {
  const [pets, setPets] = useState([]);
  const [editingPet, setEditingPet] = useState(undefined); // undefined = cerrado, null = crear, objeto = editar
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
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Mis mascotas</h1>
        <button
          onClick={() => setEditingPet(null)}
          className="rounded-full bg-ochre px-4 py-2 text-sm font-medium text-cream"
        >
          Añadir mascota
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {pets.map((pet) => (
          <PetCard key={pet.id} pet={pet} onEdit={setEditingPet} onDelete={handleDelete} />
        ))}
        {pets.length === 0 && (
          <p className="text-sm text-ink/50">Aún no has registrado ninguna mascota.</p>
        )}
      </div>

      {editingPet !== undefined && (
        <div className="fixed inset-0 z-10 flex items-end bg-ink/40 sm:items-center sm:justify-center">
          <div className="w-full max-w-md rounded-t-2xl bg-linen p-6 sm:rounded-2xl">
            <h2 className="font-display text-xl text-ink">
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
