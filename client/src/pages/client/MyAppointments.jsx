import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);

  function load() {
    api.get('/api/appointments/mine').then((data) => setAppointments(data.appointments));
  }

  useEffect(load, []);

  async function cancel(id) {
    if (!confirm('¿Cancelar esta cita?')) return;
    await api.del(`/api/appointments/${id}`);
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Mis citas</h1>
      <div className="mt-5 space-y-3">
        {appointments.map((a) => (
          <div key={a.id} className="rounded-xl border border-sage/50 bg-cream p-4">
            <div className="flex items-center justify-between">
              <p className="font-display text-lg text-ink">{a.pet_name}</p>
              <StatusBadge status={a.status} />
            </div>
            <p className="mt-1 text-sm text-ink/60">{a.service_name}</p>
            <p className="text-sm text-ink/60">{a.address}</p>
            <p className="text-sm text-ink/60">
              {a.appointment_date} · {a.start_time}
            </p>
            {(a.status === 'pending') && (
              <button onClick={() => cancel(a.id)} className="mt-2 text-xs text-clay underline underline-offset-2">
                Cancelar cita
              </button>
            )}
          </div>
        ))}
        {appointments.length === 0 && <p className="text-sm text-ink/50">Todavía no tienes citas agendadas.</p>}
      </div>
    </div>
  );
}
