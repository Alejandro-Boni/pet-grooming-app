import { useState } from 'react';
import { api } from '../api/client';

export default function AddressInput({ onConfirm }) {
  const [address, setAddress] = useState('');
  const [resolved, setResolved] = useState(null); // { address, lat, lng }
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleConfirm(e) {
    e.preventDefault();
    if (!address.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.post('/api/geocode', { address: address.trim() });
      const result = { address: data.formattedAddress, lat: data.lat, lng: data.lng };
      setResolved(result);
      onConfirm(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function editAgain() {
    setResolved(null);
    onConfirm(null);
  }

  if (resolved) {
    return (
      <div className="rounded-xl border border-pine bg-pine/5 p-4">
        <p className="text-sm text-ink/60">Dirección confirmada</p>
        <p className="mt-1 text-ink">{resolved.address}</p>
        <button onClick={editAgain} className="mt-2 text-xs text-pine underline underline-offset-2">
          Cambiar dirección
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleConfirm} className="space-y-2">
      <input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Calle, número, barrio, ciudad"
        className="w-full rounded-lg border border-sage/60 bg-cream px-3 py-2.5 text-ink"
      />
      {error && <p className="text-sm text-clay">{error}</p>}
      <button
        type="submit"
        disabled={isLoading || !address.trim()}
        className="w-full rounded-full bg-pine py-2.5 text-sm font-medium text-cream disabled:opacity-50"
      >
        {isLoading ? 'Buscando dirección…' : 'Confirmar dirección'}
      </button>
    </form>
  );
}
