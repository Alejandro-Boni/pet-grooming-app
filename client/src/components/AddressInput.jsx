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
      const result = {
        address: data.formattedAddress,
        lat: data.lat,
        lng: data.lng,
      };

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
      <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#111111] p-4 shadow-gold">
        <p className="text-sm text-[#F1E5C5]">Dirección confirmada</p>
        <p className="mt-1 text-white">{resolved.address}</p>

        <button
          onClick={editAgain}
          className="mt-2 text-xs text-[#E5C158] underline underline-offset-2"
        >
          Cambiar dirección
        </button>

        <p className="mt-3 text-[11px] text-[#F1E5C5]/60">
          Ubicación por{' '}
          <a
            href="https://locationiq.com/attribution"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            LocationIQ
          </a>{' '}
          — datos de{' '}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            © OpenStreetMap
          </a>{' '}
          contributors
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleConfirm} className="space-y-3">
      <input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Calle, número, barrio, ciudad"
        className="w-full rounded-xl border border-[#D4AF37]/40 bg-[#0F0F0F] px-3 py-2.5 text-base text-white placeholder:text-[#F1E5C5]/60 focus:border-[#E5C158] focus:outline-none"
      />

      {error && <p className="text-sm text-red-300">{error}</p>}

      <button
        type="submit"
        disabled={isLoading || !address.trim()}
        className="w-full rounded-full border border-[#D4AF37]/80 bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#A87C1F] py-2.5 text-sm font-semibold text-[#0F0F0F] shadow-gold disabled:opacity-50"
      >
        {isLoading ? 'Buscando dirección…' : 'Confirmar dirección'}
      </button>
    </form>
  );
}