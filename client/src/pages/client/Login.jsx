import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import PageTransitionLink from '../../components/PageTransitionLink';
import { playRoyalPageTransition } from '../../utils/pageTransition';

export default function Login() {
  const { login, signup, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    clearError();
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      if (mode === 'login') await login(email, password);
      else await signup(email, password);

      const { user } = await api.get('/api/auth/me');
      playRoyalPageTransition(() => {
        navigate(user.role === 'admin' ? '/admin' : '/app/mascotas');
      });
    } catch (err) {
      setSubmitError(err.message || 'No se pudo completar la solicitud. Inténtalo de nuevo.');
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
              <PageTransitionLink
                to="/"
                className="mb-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[#F1E5C5]/70 transition hover:text-[#E5C158]"
              >
                <span aria-hidden="true">←</span>
                Volver
              </PageTransitionLink>

              <div className="flex items-center gap-4">
                <img
                  src="/logo-medallon.png"
                  alt="Mascota Rey"
                  className="h-32 w-32 shrink-0 object-contain drop-shadow-[0_0_18px_rgba(212,175,55,0.35)]"
                />

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
                <img
                  src="/logo-medallon.png"
                  alt=""
                  className="mx-auto h-24 w-24 object-contain drop-shadow-[0_0_18px_rgba(212,175,55,0.35)]"
                />

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

                {(submitError || error) && (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    {submitError || error}
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
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setSubmitError(null);
                  clearError();
                }}
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