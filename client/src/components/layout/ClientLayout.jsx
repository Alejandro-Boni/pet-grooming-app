import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const TABS = [
  { to: '/app', label: 'Agendar', end: true },
  { to: '/app/mascotas', label: 'Mis mascotas' },
  { to: '/app/citas', label: 'Mis citas' },
];

export default function ClientLayout() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-linen">
      <header className="flex items-center justify-between border-b border-sage/40 px-5 py-4">
        <span className="font-display text-xl text-pine">Peluquería de Mascotas</span>
        <button onClick={logout} className="text-sm text-ink/50 underline underline-offset-2">
          Salir
        </button>
      </header>

      <main className="mx-auto max-w-lg px-5 pb-24 pt-6">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-sage/40 bg-cream">
        <div className="mx-auto flex max-w-lg justify-around py-2">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `rounded-full px-4 py-1.5 text-sm ${isActive ? 'bg-pine text-cream' : 'text-ink/60'}`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
