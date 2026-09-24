import { useState } from 'react';
import { api } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';

export default function ClientHistory() {
  const [query, setQuery] = useState('');
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [history, setHistory] = useState([]);

  async function search(e) {
    e.preventDefault();
    const data = await api.get(`/api/admin/clients?q=${encodeURIComponent(query)}`);
    setClients(data.clients);
  }

  async function openClient(client) {
    setSelectedClient(client);
    const data = await api.get(`/api/admin/clients/${client.id}/history`);
    setHistory(data.appointments);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl text-ink">Historial de clientes</h1>

      <form onSubmit={search} className="mt-4 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, teléfono o correo"
          className="flex-1 rounded-lg border border-sage/60 bg-cream px-3 py-2 text-sm text-ink"
        />
        <button type="submit" className="rounded-full bg-pine px-4 py-2 text-sm text-cream">
          Buscar
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {clients.map((c) => (
          <button
            key={c.id}
            onClick={() => openClient(c)}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              selectedClient?.id === c.id ? 'border-ochre bg-ochre/10' : 'border-sage/60'
            }`}
          >
            {c.name || c.email || c.phone}
          </button>
        ))}
      </div>

      {selectedClient && (
        <div className="mt-6 space-y-2">
          {history.map((a) => (
            <div key={a.id} className="rounded-xl border border-sage/50 bg-cream p-4">
              <div className="flex items-center justify-between">
                <p className="font-display text-lg text-ink">{a.pet_name} · {a.service_name}</p>
                <StatusBadge status={a.status} />
              </div>
              <p className="mt-1 text-sm text-ink/60">{a.appointment_date} · {a.start_time?.slice(0, 5)}</p>
              {a.stylist_notes && <p className="mt-2 text-sm text-ink/80">Nota: {a.stylist_notes}</p>}
            </div>
          ))}
          {history.length === 0 && <p className="text-sm text-ink/50">Este cliente aún no tiene citas registradas.</p>}
        </div>
      )}
    </div>
  );
}
