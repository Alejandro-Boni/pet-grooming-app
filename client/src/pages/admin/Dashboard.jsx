import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import PetAlerts from '../../components/PetAlerts';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

const STATUS_OPTIONS = [
  ['pending', 'Pendiente'],
  ['in_progress', 'En proceso'],
  ['done', 'Finalizada'],
  ['cancelled', 'Cancelada'],
];

export default function Dashboard() {
  const [date, setDate] = useState(todayKey());
  const [appointments, setAppointments] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  function load() {
    api.get(`/api/admin/appointments?date=${date}`).then((data) => setAppointments(data.appointments));
  }

  useEffect(load, [date]);

  async function updateStatus(id, status) {
    await api.patch(`/api/admin/appointments/${id}`, { status });
    load();
  }

  async function saveNotes(id, stylistNotes) {
    await api.patch(`/api/admin/appointments/${id}`, { stylistNotes });
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink">Agenda del día</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-sage/60 bg-cream px-3 py-2 text-sm text-ink"
        />
      </div>

      <div className="mt-6 space-y-0">
        {appointments.map((a, index) => (
          <div key={a.id} className="relative flex gap-4 pb-6">
            <div className="flex flex-col items-center">
              <span className="text-sm font-medium text-ink/70">{a.start_time.slice(0, 5)}</span>
              {index !== appointments.length - 1 && <span className="mt-1 w-px flex-1 bg-sage/50" />}
            </div>

            <div className="flex-1 rounded-xl border border-sage/50 bg-cream p-4">
              <button className="w-full text-left" onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}>
                <div className="flex items-center justify-between">
                  <p className="font-display text-lg text-ink">
                    {a.pet_name} <span className="text-sm font-sans text-ink/50">· {a.client_name}</span>
                  </p>
                  <StatusBadge status={a.status} />
                </div>
                <p className="mt-1 text-sm text-ink/60">{a.service_name}</p>
                <PetAlerts pet={a} />
              </button>

              {expandedId === a.id && (
                <div className="mt-4 space-y-3 border-t border-sage/40 pt-4">
                  <p className="text-sm text-ink/70">
                    Dirección:{' '}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${a.lat},${a.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-pine underline underline-offset-2"
                    >
                      {a.address}
                    </a>
                  </p>
                  <p className="text-sm text-ink/70">Teléfono del cliente: {a.client_phone || 'no registrado'}</p>

                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map(([value, label]) => (
                      <button
                        key={value}
                        onClick={() => updateStatus(a.id, value)}
                        className={`rounded-full border px-3 py-1 text-xs ${
                          a.status === value ? 'border-pine bg-pine text-cream' : 'border-sage/60 text-ink/70'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <label className="block text-sm text-ink/70">
                    Notas del estilista
                    <textarea
                      defaultValue={a.stylist_notes || ''}
                      rows={2}
                      onBlur={(e) => saveNotes(a.id, e.target.value)}
                      className="mt-1 w-full rounded-lg border border-sage/60 bg-linen px-3 py-2 text-sm text-ink"
                      placeholder="Ej. corte estándar caniche, tijera en las patas"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        ))}
        {appointments.length === 0 && <p className="text-sm text-ink/50">No hay citas agendadas para este día.</p>}
      </div>
    </div>
  );
}
