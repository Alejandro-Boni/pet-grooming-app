import { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ average_rating: 0, total_reviews: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadReviews() {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/api/admin/reviews');
      setReviews(data.reviews || []);
      setSummary({
        average_rating: data.average_rating || 0,
        total_reviews: data.total_reviews || 0,
      });
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las reseñas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, []);

  async function setVisibility(review, visible) {
    setError('');
    try {
      await api.patch(`/api/admin/reviews/${review.id}/visibility`, { visible });
      await loadReviews();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la reseña.');
    }
  }

  async function deleteReview(review) {
    if (!window.confirm('¿Eliminar esta reseña permanentemente? Esta acción no se puede deshacer.')) {
      return;
    }

    setError('');
    try {
      await api.del(`/api/admin/reviews/${review.id}`);
      await loadReviews();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la reseña.');
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl text-white">Reseñas</h1>
      <p className="mt-2 text-sm text-[#F1E5C5]">
        Promedio: {summary.average_rating} / 5 · {summary.total_reviews} reseñas
      </p>

      {error && (
        <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-5 text-sm text-[#F1E5C5]">Cargando reseñas...</p>
      ) : reviews.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-[#D4AF37]/30 bg-[#111111] p-4 text-sm text-[#F1E5C5]">
          Aún no hay reseñas.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-2xl border border-[#D4AF37]/30 bg-[#111111] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#E5C158]">
                    {'★'.repeat(review.rating)}{' '}
                    <span className="text-sm text-[#F1E5C5]">
                      · {review.service_name} · {review.customer_name || 'Cliente'}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-[#F1E5C5]/70">
                    {new Date(review.created_at).toLocaleDateString()}
                    {!review.is_visible && ' · Oculta para clientes'}
                  </p>
                </div>
                <div className="flex gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => setVisibility(review, !review.is_visible)}
                    className="text-[#E5C158] underline underline-offset-2"
                  >
                    {review.is_visible ? 'Ocultar' : 'Mostrar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteReview(review)}
                    className="text-red-300 underline underline-offset-2"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              {review.comment && (
                <p className="mt-3 whitespace-pre-wrap text-sm text-[#F1E5C5]">
                  {review.comment}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
