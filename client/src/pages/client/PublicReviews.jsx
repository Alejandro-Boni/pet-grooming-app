import { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function PublicReviews() {
  const [reviewData, setReviewData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/api/reviews')
      .then((data) => {
        if (active) setReviewData(data);
      })
      .catch((err) => {
        if (active) setError(err.message || 'No se pudieron cargar las reseñas.');
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="mx-auto mt-10 max-w-6xl" aria-labelledby="reviews-title">
      <div className="rounded-[28px] border border-[#D4AF37]/30 bg-[#111111] p-6 shadow-gold sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#E5C158]">
              Experiencias de nuestros clientes
            </p>
            <h1 id="reviews-title" className="mt-2 font-display text-3xl text-white">
              Reseñas
            </h1>
          </div>
          {reviewData && (
            <p className="text-sm text-[#F1E5C5]">
              <span className="text-lg font-semibold text-[#E5C158]">
                {reviewData.average_rating} ★
              </span>
              {' '}· {reviewData.total_reviews} reseñas
            </p>
          )}
        </div>

        {error ? (
          <p className="mt-5 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </p>
        ) : !reviewData ? (
          <p className="mt-5 text-sm text-[#F1E5C5]">Cargando reseñas...</p>
        ) : reviewData.reviews.length === 0 ? (
          <p className="mt-5 text-sm text-[#F1E5C5]">
            Aún no hay reseñas publicadas.
          </p>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {reviewData.reviews.map((review) => (
              <article
                key={review.id}
                className="rounded-2xl border border-[#D4AF37]/20 bg-[#0F0F0F] p-4"
              >
                <p
                  className="text-lg tracking-widest text-[#E5C158]"
                  aria-label={`${review.rating} de 5 estrellas`}
                >
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.12em] text-[#F1E5C5]/70">
                  {review.service_name} · {new Date(review.created_at).toLocaleDateString()}
                </p>
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
    </section>
  );
}
