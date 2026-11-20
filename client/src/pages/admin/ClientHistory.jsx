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
    <div className="bento-grid">
      <div className="bento-card md:col-span-4">
        <h1 className="font-display text-2xl text-white">Historial de clientes</h1>

        <form onSubmit={search} className="mt-4 flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, teléfono o correo"
            className="min-w-0 flex-1 rounded-xl border border-[#D4AF37]/60 bg-[#0F0F0F] px-3 py-2 text-sm text-white caret-[#E5C158] placeholder:text-white/50 focus:border-[#D4AF37] focus:outline-none"
          />
          <button type="submit" className="gold-button px-4 py-2 text-sm">
            Buscar
          </button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          {clients.map((c) => (
            <button
              key={c.id}
              onClick={() => openClient(c)}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                selectedClient?.id === c.id
                  ? 'border-[#E5C158] bg-[#D4AF37]/10 text-[#E5C158]'
                  : 'border-[#D4AF37]/40 text-[#F1E5C5]'
              }`}
            >
              {c.name || c.email || c.phone}
            </button>
          ))}
        </div>
      </div>

      {selectedClient && (
        <div className="bento-card md:col-span-8">
          <p className="bento-kicker">Historial seleccionado</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
          {history.map((a) => (
            <div key={a.id} className="rounded-[20px] border border-[#D4AF37]/30 bg-[#0F0F0F] p-4">
              <div className="flex items-center justify-between">
                <p className="font-display text-lg text-white">{a.pet_name} · {a.service_name}</p>
                <StatusBadge status={a.display_status || a.status} />
              </div>
              <p className="mt-1 text-sm text-[#F1E5C5]/70">{a.appointment_date} · {a.start_time?.slice(0, 5)}</p>
              {a.stylist_notes && <p className="mt-2 text-sm text-[#F1E5C5]">Nota: {a.stylist_notes}</p>}
            </div>
          ))}
          </div>
          {history.length === 0 && <p className="mt-3 text-sm text-[#F1E5C5]/70">Este cliente aún no tiene citas registradas.</p>}
        </div>
      )}
    </div>
  );
}
