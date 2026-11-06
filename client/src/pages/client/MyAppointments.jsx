import { useEffect, useState } from 'react';
import { api } from '../../api/client';

const STAR_ICONS = ['★', '★', '★', '★', '★'];

function RatingStars({ value = 0, size = 'text-lg' }) {
  return (
    <div className={`flex gap-1 ${size}`}>
      {STAR_ICONS.map((star, index) => (
        <span
          key={star + index}
          className={index < value ? 'text-[#E5C158]' : 'text-[#5A5A5A]'}
        >
          {star}
        </span>
      ))}
    </div>
  );
}

function getNormalizedStatus(appointment) {
  const raw = appointment?.status || appointment?.display_status || '';
  return String(raw).toLowerCase();
}

function isAppointmentFinished(appointment) {
  const status = getNormalizedStatus(appointment);

  return (
    status === 'done' ||
    status === 'finalizada' ||
    status === 'finalizado' ||
    status === 'completed'
  );
}

function formatStatusLabel(status) {
  const normalized = String(status || '').toLowerCase();

  if (normalized === 'done') return 'Finalizada';
  if (normalized === 'pending') return 'Pendiente';
  if (normalized === 'cancelled') return 'Cancelada';
  if (normalized === 'in_progress') return 'En curso';
  if (normalized === 'finalizada' || normalized === 'finalizado') return 'Finalizada';
  return status || 'Finalizada';
}

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function loadAppointments() {
    setLoading(true);
    api
      .get('/api/appointments/mine')
      .then((data) => setAppointments(data.appointments || []))
      .catch((err) => setError(err.message || 'No se pudieron cargar tus citas'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  function openReview(appointmentId) {
    setReviewDrafts((prev) => ({
      ...prev,
      [appointmentId]: {
        ...prev[appointmentId],
        rating: prev[appointmentId]?.rating ?? 5,
        comment: prev[appointmentId]?.comment ?? '',
      },
    }));
  }

  async function submitReview(appointmentId) {
    const draft = reviewDrafts[appointmentId];
    if (!draft) return;

    try {
      await api.post('/api/appointments/reviews', {
        appointmentId,
        rating: Number(draft.rating),
        comment: draft.comment,
      });

      setReviewDrafts((prev) => {
        const next = { ...prev };
        delete next[appointmentId];
        return next;
      });

      loadAppointments();
    } catch (err) {
      setError(err.message || 'No se pudo guardar tu reseña');
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-[#D4AF37]/30 bg-[#111111] p-5 shadow-gold">
        <h1 className="font-display text-3xl text-white">Mis citas</h1>
        <p className="mt-2 text-sm text-[#F1E5C5]">
          Mira el historial de tus servicios y deja una reseña si ya terminó la atención.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#111111] p-5 text-sm text-[#F1E5C5]">
          Cargando tus citas...
        </div>
      ) : appointments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D4AF37]/30 bg-[#111111] p-6 text-sm text-[#F1E5C5]">
          Aún no tienes citas agendadas.
        </div>
      ) : (
        appointments.map((appointment) => {
          const finished = isAppointmentFinished(appointment);
          const reviewDraft = reviewDrafts[appointment.id];

          return (
            <div
              key={appointment.id}
              className="rounded-[24px] border border-[#D4AF37]/30 bg-[#111111] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#E5C158]">
                    {appointment.service_name}
                  </p>
                  <h2 className="mt-1 font-display text-2xl text-white">
                    {appointment.pet_name}
                  </h2>
                  <p className="mt-1 text-sm text-[#F1E5C5]">
                    {appointment.appointment_date} · {appointment.start_time} - {appointment.end_time}
                  </p>
                </div>

                <span className="rounded-full border border-[#D4AF37]/40 bg-[#0F0F0F] px-3 py-1 text-xs uppercase tracking-[0.12em] text-[#E5C158]">
                  {formatStatusLabel(appointment.status || appointment.display_status)}
                </span>
              </div>

              {finished && (
                <div className="mt-4 rounded-2xl border border-[#D4AF37]/20 bg-[#0F0F0F] p-3">
                  {appointment.review_id ? (
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[#E5C158]">
                        Tu reseña
                      </p>
                      <RatingStars value={appointment.review_rating} />
                      {appointment.review_comment && (
                        <p className="mt-2 text-sm text-[#F1E5C5]">{appointment.review_comment}</p>
                      )}
                    </div>
                  ) : !reviewDraft ? (
                    <button
                      type="button"
                      onClick={() => openReview(appointment.id)}
                      className="rounded-full border border-[#D4AF37]/60 bg-[#D4AF37]/10 px-4 py-2 text-sm font-medium text-[#F1E5C5] hover:border-[#E5C158]"
                    >
                      Dejar reseña
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#E5C158]">
                          Calificación
                        </label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() =>
                                setReviewDrafts((prev) => ({
                                  ...prev,
                                  [appointment.id]: {
                                    ...prev[appointment.id],
                                    rating: star,
                                  },
                                }))
                              }
                              className={`text-2xl ${
                                star <= (reviewDraft.rating ?? 0) ? 'text-[#E5C158]' : 'text-[#5A5A5A]'
                              }`}
                              aria-label={`Calificar con ${star} estrellas`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#E5C158]">
                          Comentario
                        </label>
                        <textarea
                          rows={4}
                          value={reviewDraft.comment || ''}
                          onChange={(e) =>
                            setReviewDrafts((prev) => ({
                              ...prev,
                              [appointment.id]: {
                                ...prev[appointment.id],
                                comment: e.target.value,
                              },
                            }))
                          }
                          placeholder="Cuéntanos cómo fue el servicio..."
                          className="w-full resize-none rounded-2xl border border-[#D4AF37]/30 bg-[#111111] px-3 py-2 text-sm text-white placeholder:text-[#F1E5C5]/60 focus:border-[#E5C158] focus:outline-none"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => submitReview(appointment.id)}
                          className="rounded-full bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#0F0F0F]"
                        >
                          Enviar reseña
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setReviewDrafts((prev) => {
                              const next = { ...prev };
                              delete next[appointment.id];
                              return next;
                            })
                          }
                          className="rounded-full border border-[#D4AF37]/30 px-4 py-2 text-sm text-[#F1E5C5]"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}