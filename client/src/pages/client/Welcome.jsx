import { Link } from 'react-router-dom';
import PublicReviews from './PublicReviews';

export default function Welcome() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] px-4 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="relative w-full max-w-6xl overflow-hidden rounded-[36px] border border-[#D4AF37]/30 bg-[#111111]/90 shadow-[0_0_0_1px_rgba(212,175,55,0.14),0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-md">
          <div
            className="absolute inset-0 opacity-90"
            style={{
              background:
                'radial-gradient(circle at 50% 30%, rgba(212,175,55,0.22), rgba(212,175,55,0.08) 22%, rgba(0,0,0,0) 42%)',
            }}
          />

          <div className="relative z-10 flex min-h-[720px] flex-col justify-center p-6 sm:p-10 lg:p-12">
            <div className="mx-auto flex w-full max-w-5xl flex-col items-center text-center">
              <div className="mb-6">
                <img
                  src="/logo-medallon.png"
                  alt="Mascota Rey"
                  className="h-40 w-40 object-contain drop-shadow-[0_0_30px_rgba(212,175,55,0.4)] sm:h-48 sm:w-48"
                />
              </div>

              <div className="mb-5">
                <div className="font-display text-[2.8rem] tracking-[0.08em] text-[#E5C158] sm:text-[4rem]">
                  MASCOTA REY
                </div>
                <div className="mt-2 text-[0.7rem] uppercase tracking-[0.38em] text-[#F1E5C5]/70">
                  Luxury Pet Care
                </div>
              </div>

              <h1 className="max-w-3xl font-display text-4xl leading-none text-[#F7F1E3] sm:text-6xl">
                Peluquería Canina y Felina.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-[#F1E5C5]/80 sm:text-lg">
                Un cuidado premium y exclusivo para perros y gatos que merecen lo mejor.
              </p>

              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-full border border-[#D4AF37]/80 bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#A87C1F] px-8 py-4 text-base font-semibold text-[#0F0F0F] shadow-[0_10px_25px_rgba(212,175,55,0.35)] transition hover:brightness-105"
                >
                  Agendar una cita
                </Link>

                <a
                  href="https://wa.me/573204365478"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#111111]/50 px-8 py-4 text-base font-medium text-[#F1E5C5] transition hover:border-[#E5C158] hover:text-white"
                >
                  Escríbenos por WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <PublicReviews />
    </div>
  );
}