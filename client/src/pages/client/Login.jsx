import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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
      navigate('/app');
    } catch {
      // el mensaje de error ya queda disponible vía useAuth().error
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linen px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl text-ink">
          {mode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
        </h1>
        <p className="mt-1 text-sm text-ink/60">
          Ingresa con tu correo para agendar en segundos, sin llenar formularios largos.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            type="email"
            required
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-sage/60 bg-cream px-3 py-2.5 text-ink"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-sage/60 bg-cream px-3 py-2.5 text-ink"
          />
          {error && <p className="text-sm text-clay">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-pine py-2.5 text-sm font-medium text-cream disabled:opacity-60"
          >
            {mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="mt-4 text-sm text-ink/60 underline underline-offset-2"
        >
          {mode === 'login' ? '¿Primera vez? Crea tu cuenta' : 'Ya tengo una cuenta'}
        </button>
      </div>
    </div>
  );
}
