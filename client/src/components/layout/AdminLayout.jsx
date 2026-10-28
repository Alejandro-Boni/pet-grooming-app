import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LINKS = [
  { to: '/admin', label: 'Agenda del día', end: true },
  { to: '/admin/disponibilidad', label: 'Disponibilidad' },
  { to: '/admin/clientes', label: 'Historial de clientes' },
];

export default function AdminLayout() {
  const { logout, profile } = useAuth();

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white sm:flex">
      <aside className="border-b border-[#D4AF37]/30 bg-[#111111] px-5 py-6 text-white sm:min-h-screen sm:w-64 sm:border-b-0 sm:border-r">
        <p className="font-display text-xl text-[#E5C158]">Panel del negocio</p>
        <p className="mt-2 text-xs text-[#F1E5C5]">
          {profile?.name || profile?.email || 'Administrador'}
        </p>

        <nav className="mt-6 flex gap-1 sm:mt-8 sm:flex-col">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-xl px-3 py-2 text-sm transition ${
                  isActive
                    ? 'bg-[#D4AF37] text-[#0F0F0F] font-semibold'
                    : 'text-[#F1E5C5] hover:bg-white/5'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={logout}
          className="mt-8 text-xs text-[#F1E5C5] underline underline-offset-2 hover:text-white"
        >
          Cerrar sesión
        </button>
      </aside>

      <main className="flex-1 bg-[#0F0F0F] px-5 py-6 sm:px-8">
        <Outlet />
      </main>
    </div>
  );
}