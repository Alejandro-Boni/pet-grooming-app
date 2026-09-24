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
    <div className="min-h-screen bg-linen sm:flex">
      <aside className="border-b border-sage/40 bg-pine px-5 py-6 text-cream sm:min-h-screen sm:w-56 sm:border-b-0 sm:border-r">
        <p className="font-display text-lg">Panel del negocio</p>
        <p className="mt-1 text-xs text-cream/60">{profile?.name || profile?.email}</p>
        <nav className="mt-6 flex gap-1 sm:mt-8 sm:flex-col">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-cream/15 font-medium' : 'text-cream/70'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <button onClick={logout} className="mt-8 text-xs text-cream/50 underline underline-offset-2">
          Cerrar sesión
        </button>
      </aside>
      <main className="flex-1 px-5 py-6 sm:px-8">
        <Outlet />
      </main>
    </div>
  );
}
