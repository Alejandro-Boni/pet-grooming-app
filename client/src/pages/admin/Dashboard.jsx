import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import PetAlerts from '../../components/PetAlerts';
import { formatPrice } from '../../utils/format';

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
    <div className="min-h-screen bg-[#0F0F0F] px-2 py-4 text-white">
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="royal-panel">
          <p className="text-xs uppercase tracking-[0.2em] text-[#E5C158]">Ingresos del mes</p>
          <h2 className="mt-3 text-4xl font-bold text-white">$4.850.000</h2>
          <p className="mt-2 text-sm text-[#F1E5C5]">+18.4% versus el mes pasado</p>
        </div>

        <div className="royal-panel">
          <p className="text-xs uppercase tracking-[0.2em] text-[#E5C158]">Clientes frecuentes</p>
          <h2 className="mt-3 text-4xl font-bold text-white">128</h2>
          <p className="mt-2 text-sm text-[#F1E5C5]">Tasa de retención alta</p>
        </div>

        <div className="royal-panel">
          <p className="text-xs uppercase tracking-[0.2em] text-[#E5C158]">Descuentos automáticos</p>
          <h2 className="mt-3 text-4xl font-bold text-white">12%</h2>
          <p className="mt-2 text-sm text-[#F1E5C5]">Activados para clientes VIP</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-[#D4AF37]/30 bg-[#111111]/90 p-4 shadow-gold backdrop-blur-md">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#E5C158]">Panel administrativo</p>
          <h1 className="mt-1 font-display text-3xl text-white">Agenda del día</h1>
        </div>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-full border border-[#D4AF37]/40 bg-[#0F0F0F] px-4 py-2.5 text-sm text-white outline-none focus:border-[#E5C158]"
        />
      </div>

      <div className="mt-6 space-y-4">
        {appointments.map((a, index) => (
          <div key={a.id} className="relative flex gap-4 pb-6">
            <div className="flex flex-col items-center">
              <span className="text-sm font-medium text-[#F1E5C5]">{a.start_time.slice(0, 5)}</span>
              {index !== appointments.length - 1 && <span className="mt-1 w-px flex-1 bg-[#D4AF37]/40" />}
            </div>

            <div className="glass-card flex-1 p-4">
              <button className="w-full text-left" onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}>
                <div className="flex items-center justify-between">
                  <p className="font-display text-xl text-white">
                    {a.pet_name} <span className="text-sm font-sans text-[#F1E5C5]">· {a.client_name}</span>
                  </p>
                  <StatusBadge status={a.status} />
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <p className="text-sm text-[#F1E5C5]">{a.service_name}</p>
                  {formatPrice(a.price_cop) && (
                    <p className="text-sm font-semibold text-[#E5C158]">{formatPrice(a.price_cop)}</p>
                  )}
                </div>

                <div className="mt-2">
                  <PetAlerts pet={a} />
                </div>
              </button>

              {expandedId === a.id && (
                <div className="mt-4 space-y-3 border-t border-[#D4AF37]/20 pt-4">
                  <p className="text-sm text-[#F1E5C5]">
                    Dirección:{' '}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${a.lat},${a.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#E5C158] underline underline-offset-2"
                    >
                      {a.address}
                    </a>
                  </p>

                  <p className="text-sm text-[#F1E5C5]">Teléfono del cliente: {a.client_phone || 'no registrado'}</p>

                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map(([value, label]) => (
                      <button
                        key={value}
                        onClick={() => updateStatus(a.id, value)}
                        className={`rounded-full border px-3 py-1.5 text-xs ${
                          a.status === value
                            ? 'border-[#D4AF37] bg-[#D4AF37] text-[#0F0F0F]'
                            : 'border-[#D4AF37]/35 bg-[#0F0F0F] text-[#F1E5C5]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <label className="block text-sm text-[#F1E5C5]">
                    Notas del estilista
                    <textarea
                      defaultValue={a.stylist_notes || ''}
                      rows={2}
                      onBlur={(e) => saveNotes(a.id, e.target.value)}
                      className="mt-1 w-full rounded-2xl border border-[#D4AF37]/30 bg-[#0F0F0F] px-3 py-2 text-sm text-white placeholder:text-[#F1E5C5]/60"
                      placeholder="Ej. corte estándar caniche, tijera en las patas"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        ))}

        {appointments.length === 0 && (
          <p className="rounded-2xl border border-[#D4AF37]/30 bg-[#111111]/80 p-4 text-sm text-[#F1E5C5]">
            No hay citas agendadas para este día.
          </p>
        )}
      </div>
    </div>
  );
}