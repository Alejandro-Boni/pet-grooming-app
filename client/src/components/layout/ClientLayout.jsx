import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const TABS = [
  { to: '/app', label: 'Agendar', end: true },
  { to: '/app/mascotas', label: 'Mis mascotas' },
  { to: '/app/citas', label: 'Mis citas' },
  { to: '/app/resenas', label: 'Reseñas' },
  { to: '/app/nosotros', label: 'Nosotros' },
];

export default function ClientLayout() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <header className="flex items-center justify-between border-b border-[#D4AF37]/30 bg-[#111111] px-5 py-4">
        <span className="font-display text-xl text-[#E5C158]">Mascota Rey</span>
        <button
          onClick={logout}
          className="text-sm text-[#F1E5C5] underline underline-offset-2 hover:text-white"
        >
          Salir
        </button>
      </header>

      <main className="mx-auto max-w-lg px-5 pb-24 pt-6">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-[#D4AF37]/30 bg-[#111111]">
        <div className="mx-auto flex max-w-lg justify-around py-2">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `rounded-full px-3 py-1.5 text-xs transition sm:text-sm ${
                  isActive
                    ? 'bg-[#D4AF37] text-[#0F0F0F] font-semibold'
                    : 'text-[#F1E5C5] hover:text-white'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <a
        href="https://wa.me/573204365478"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-24 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-[#D4AF37]/60 bg-[#25D366] text-2xl shadow-[0_10px_30px_rgba(37,211,102,0.35)] transition hover:scale-105"
        aria-label="Chatea por WhatsApp"
      >
        💬
      </a>
    </div>
  );
}