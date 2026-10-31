import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';

function LuxuryBadge() {
  return (
    <svg
      width={120}
      height={120}
      viewBox="0 0 120 120"
      aria-label="Mascota Rey"
      className="drop-shadow-[0_0_18px_rgba(212,175,55,0.35)]"
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

        {/* Huella de perro centrada y posicionada en el medio del círculo */}
        <g transform="translate(30, 48) scale(0.6)" fill="#111111">
          {/* Dedos de la huella */}
          <ellipse cx="22" cy="18" rx="7" ry="9" transform="rotate(-15 22 18)" />
          <ellipse cx="38" cy="11" rx="7" ry="9" transform="rotate(-5 38 11)" />
          <ellipse cx="56" cy="12" rx="7" ry="9" transform="rotate(10 56 12)" />
          <ellipse cx="71" cy="20" rx="7" ry="9" transform="rotate(20 71 20)" />
          
          {/* Almohadilla principal de la huella */}
          <path d="M46 32 C33 32, 27 41, 29 51 C31 61, 38 68, 47 68 C57 68, 63 61, 65 51 C67 41, 60 32, 46 32 Z" />
        </g>

        {/* Corona ajustada en la parte superior */}
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

export default function Login() {
  const { login, signup, error } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (mode === 'login') await login(email, password);
      else await signup(email, password);

      const { user } = await api.get('/api/auth/me');
      navigate(user.role === 'admin' ? '/admin' : '/app');
    } catch {
      // el mensaje de error ya queda disponible vía useAuth().error
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] px-4 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-[#D4AF37]/30 bg-[#111111]/90 shadow-gold backdrop-blur-md lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative flex flex-col justify-center overflow-hidden border-b border-[#D4AF37]/20 bg-[#0F0F0F] p-8 lg:border-b-0 lg:border-r">
            <div className="absolute inset-0 bg-gold-radial opacity-80" />
            <div className="relative z-10">
              <div className="flex items-center gap-4">
                <LuxuryBadge />

                <div className="leading-none">
                  <div className="font-display text-[2.5rem] tracking-[0.08em] text-[#E5C158]">
                    Mascota Rey
                  </div>
                  <div className="mt-2 text-[0.7rem] uppercase tracking-[0.28em] text-[#F1E5C5]/70">
                    Luxury Pet Care
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center p-6 sm:p-8 lg:p-10">
            <div className="w-full max-w-md">
              <div className="mb-8 text-center">
                <div className="login-dog-badge mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#D4AF37]/60 bg-[#D4AF37]/10 shadow-gold">
                  <span className="login-dog-emoji text-5xl">🐶</span>
                </div>

                <h2 className="mt-5 font-display text-4xl text-white">
                  {mode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
                </h2>
                <p className="mt-2 text-sm text-[#F1E5C5]">
                  {mode === 'login'
                    ? 'Ingresa para cuidar a tu mascota con estilo.'
                    : 'Únete a la experiencia premium de Mascota Rey.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-[10px] uppercase tracking-[0.28em] text-[#E5C158]">
                      Correo
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="correo@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-14 w-full rounded-2xl border border-[#D4AF37]/35 bg-[#0F0F0F] px-4 text-base text-white placeholder:text-[#F1E5C5]/60 focus:border-[#E5C158] focus:outline-none"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[10px] uppercase tracking-[0.28em] text-[#E5C158]">
                      Contraseña
                    </span>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-14 w-full rounded-2xl border border-[#D4AF37]/35 bg-[#0F0F0F] px-4 text-base text-white placeholder:text-[#F1E5C5]/60 focus:border-[#E5C158] focus:outline-none"
                    />
                  </label>
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="gold-button h-14 w-full rounded-[18px] px-6 text-base font-semibold tracking-[0.08em] transition-all duration-200 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting
                    ? mode === 'login'
                      ? 'Ingresando...'
                      : 'Creando cuenta...'
                    : mode === 'login'
                      ? 'Ingresar'
                      : 'Crear cuenta'}
                </button>
              </form>

              <button
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="mt-6 w-full rounded-full border border-[#D4AF37]/30 bg-[#111111] px-4 py-3 text-center text-sm text-[#F1E5C5] transition hover:border-[#E5C158] hover:text-white"
              >
                {mode === 'login' ? '¿Primera vez? Crea tu cuenta' : 'Ya tengo una cuenta'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}