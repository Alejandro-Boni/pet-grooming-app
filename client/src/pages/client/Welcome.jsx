import { Link } from 'react-router-dom';

function LuxuryBadge() {
  return (
    <svg
      width={150}
      height={150}
      viewBox="0 0 120 120"
      aria-label="Mascota Rey"
      className="drop-shadow-[0_0_30px_rgba(212,175,55,0.4)]"
    >
      <defs>
        <linearGradient id="goldBadge" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#f9e9a5" />
          <stop offset="28%" stopColor="#e7c75d" />
          <stop offset="65%" stopColor="#c9981c" />
          <stop offset="100%" stopColor="#8a630f" />
        </linearGradient>

        <linearGradient id="crownGold" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#fdf0ba" />
          <stop offset="30%" stopColor="#d7b14d" />
          <stop offset="70%" stopColor="#b57e13" />
          <stop offset="100%" stopColor="#8d620d" />
        </linearGradient>
      </defs>

      <g>
        <circle cx="60" cy="60" r="47" fill="url(#goldBadge)" />
        <circle cx="60" cy="60" r="42" fill="rgba(17,17,17,0.08)" />

        <g transform="translate(30, 48) scale(0.6)" fill="#111111">
          <ellipse cx="22" cy="18" rx="7" ry="9" transform="rotate(-15 22 18)" />
          <ellipse cx="38" cy="11" rx="7" ry="9" transform="rotate(-5 38 11)" />
          <ellipse cx="56" cy="12" rx="7" ry="9" transform="rotate(10 56 12)" />
          <ellipse cx="71" cy="20" rx="7" ry="9" transform="rotate(20 71 20)" />
          <path d="M46 32 C33 32, 27 41, 29 51 C31 61, 38 68, 47 68 C57 68, 63 61, 65 51 C67 41, 60 32, 46 32 Z" />
        </g>

        <g transform="translate(0,-10)">
          <path
            d="M18 44 L28 22 L40 36 L52 18 L60 30 L68 18 L80 36 L92 22 L102 44 L102 52 L18 52 Z"
            fill="url(#crownGold)"
            stroke="#f1d98a"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M24 52 H96 V56 H24 Z" fill="url(#crownGold)" />
          <circle cx="28" cy="26" r="3.5" fill="#f7e8ad" />
          <circle cx="40" cy="34" r="3.5" fill="#f7e8ad" />
          <circle cx="52" cy="20" r="3.5" fill="#f7e8ad" />
          <circle cx="60" cy="30" r="3.5" fill="#f7e8ad" />
          <circle cx="68" cy="20" r="3.5" fill="#f7e8ad" />
          <circle cx="80" cy="34" r="3.5" fill="#f7e8ad" />
          <circle cx="92" cy="26" r="3.5" fill="#f7e8ad" />
        </g>
      </g>
    </svg>
  );
}

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
                <LuxuryBadge />
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
                Perruqueria Canina y Felina.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-[#F1E5C5]/80 sm:text-lg">
                Un cuidado premium y exclusivo para perros y gatos que merecen lo mejor.
              </p>

              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-full border border-[#D4AF37]/80 bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#A87C1F] px-8 py-4 text-base font-semibold text-[#111111] shadow-[0_12px_30px_rgba(212,175,55,0.35)] transition hover:brightness-110 hover:scale-[1.02]"
                >
                  Agendar una cita
                </Link>

                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#111111]/50 px-8 py-4 text-base font-medium text-[#F1E5C5] transition hover:border-[#E5C158] hover:text-white"
                >
                  Iniciar sesión
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}