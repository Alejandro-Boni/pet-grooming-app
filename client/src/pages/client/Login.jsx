import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';

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
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#D4AF37]/60 bg-[#D4AF37] text-2xl text-[#0F0F0F] shadow-gold">
                  👑
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-[#E5C158]">Mascota Rey</p>
                  <h1 className="font-display text-3xl text-white">Luxury Pet Care</h1>
                </div>
              </div>

              <p className="max-w-md text-lg text-[#F1E5C5]">
                Cuidado premium para tus mascotas, con atención a domicilio y experiencia VIP.
              </p>

              <div className="mt-8 rounded-[28px] border border-[#D4AF37]/20 bg-[#151515]/90 p-5 shadow-gold">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-[#E5C158]">Hoy</p>
                    <p className="mt-2 text-2xl font-bold text-white">Servicio premium</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-2xl">
                    🐾
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between rounded-2xl border border-[#D4AF37]/20 bg-[#0F0F0F] px-3 py-2">
                    <span className="text-sm text-[#F1E5C5]">Baño completo</span>
                    <span className="font-semibold text-[#E5C158]">$120.000</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-[#D4AF37]/20 bg-[#0F0F0F] px-3 py-2">
                    <span className="text-sm text-[#F1E5C5]">Corte premium</span>
                    <span className="font-semibold text-[#E5C158]">$180.000</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-[#D4AF37]/20 bg-[#0F0F0F] px-3 py-2">
                    <span className="text-sm text-[#F1E5C5]">Salud express</span>
                    <span className="font-semibold text-[#E5C158]">$90.000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center p-6 sm:p-8 lg:p-10">
            <div className="w-full max-w-md">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-[#D4AF37]/60 bg-gradient-to-br from-[#E5C158] to-[#A87C1F] text-4xl text-[#0F0F0F] shadow-gold">
                  🐶
                </div>
                <h2 className="font-display text-3xl text-white">
                  {mode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
                </h2>
                <p className="mt-2 text-sm text-[#F1E5C5]">
                  {mode === 'login'
                    ? 'Ingresa para cuidar a tu mascota con estilo.'
                    : 'Únete a la experiencia premium de Mascota Rey.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-3">
                  <label className="block">
                    <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#E5C158]">
                      Correo
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="correo@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-2xl border border-[#D4AF37]/35 bg-[#0F0F0F] px-4 py-3 text-white placeholder:text-[#F1E5C5]/60 focus:border-[#E5C158] focus:outline-none"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#E5C158]">
                      Contraseña
                    </span>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-2xl border border-[#D4AF37]/35 bg-[#0F0F0F] px-4 py-3 text-white placeholder:text-[#F1E5C5]/60 focus:border-[#E5C158] focus:outline-none"
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
                  className="gold-button w-full px-6 py-3"
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
                className="mt-6 w-full text-center text-sm text-[#F1E5C5] underline underline-offset-4 hover:text-white"
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