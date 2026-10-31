import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import { formatPrice } from '../../utils/format';

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [cancelFeedback, setCancelFeedback] = useState({});

  function load() {
    api.get('/api/appointments/mine').then((data) => setAppointments(data.appointments));
  }

  useEffect(load, []);

  function setFeedback(id, type, text) {
    setCancelFeedback((prev) => ({
      ...prev,
      [id]: { type, text },
    }));
  }

  async function cancel(id) {
    const confirmed = window.confirm(
      '¿Cancelar esta cita?\n\n' +
        'Importante: después de agendar una cita solo se puede cancelar con 4 horas de anticipación.\n' +
        'Si la cita inicia dentro de las próximas 4 horas, no será posible cancelarla.'
    );

    if (!confirmed) return;

    try {
      await api.del(`/api/appointments/${id}`);
      setFeedback(id, 'success', 'Cita cancelada correctamente.');
      load();
    } catch (err) {
      const message =
        'No se pudo cancelar la cita porque la cancelación solo está permitida con 4 horas de anticipación. ' +
        'Si la cita empieza en menos de 4 horas, la reserva ya no puede cancelarse desde la app.';
      setFeedback(id, 'error', message);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Mis citas</h1>

      <div className="mt-5 space-y-3">
        {appointments.map((a) => {
          const feedback = cancelFeedback[a.id];

          return (
            <div
              key={a.id}
              className={`rounded-xl border p-4 ${
                a.status === 'cancelled'
                  ? 'border-slate-200 bg-slate-100'
                  : 'border-sage/50 bg-cream'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="font-display text-lg text-ink">{a.pet_name}</p>
                <StatusBadge status={a.status} />
              </div>

              <div className="mt-1 flex items-center justify-between">
                <p className="text-sm text-ink/60">{a.service_name}</p>
                {formatPrice(a.price_cop) && (
                  <p className="text-sm text-ink/60">{formatPrice(a.price_cop)}</p>
                )}
              </div>

              <p className="text-sm text-ink/60">{a.address}</p>
              <p className="text-sm text-ink/60">
                {a.appointment_date} · {a.start_time}
              </p>

              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
                Política de cancelación: después de agendar una cita solo se puede cancelar con 4 horas de anticipación.
              </div>

              {feedback && (
                <div
                  className={`mt-3 rounded-lg border p-2 text-xs ${
                    feedback.type === 'success'
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                      : 'border-red-300 bg-red-50 text-red-900'
                  }`}
                >
                  {feedback.text}
                </div>
              )}

              {a.status === 'pending' && (
                <button
                  onClick={() => cancel(a.id)}
                  className="mt-3 text-xs text-clay underline underline-offset-2"
                >
                  Cancelar cita
                </button>
              )}
            </div>
          );
        })}

        {appointments.length === 0 && (
          <p className="text-sm text-ink/50">Todavía no tienes citas agendadas.</p>
        )}
      </div>
    </div>
  );
}