import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Welcome from './pages/client/Welcome';
import Login from './pages/client/Login';
import ClientLayout from './components/layout/ClientLayout';
import BookingFlow from './pages/client/BookingFlow';
import MyPets from './pages/client/MyPets';
import MyAppointments from './pages/client/MyAppointments';

import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Availability from './pages/admin/Availability';
import ClientHistory from './pages/admin/ClientHistory';

function LoadingScreen() {
  return <div className="flex min-h-screen items-center justify-center bg-linen text-ink/50">Cargando…</div>;
}

function RequireAuth({ children }) {
  const { isLoading, isAuthenticated } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { isLoading, isAuthenticated, isAdmin } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/app" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/app"
        element={
          <RequireAuth>
            <ClientLayout />
          </RequireAuth>
        }
      >
        <Route index element={<BookingFlow />} />
        <Route path="mascotas" element={<MyPets />} />
        <Route path="citas" element={<MyAppointments />} />
      </Route>

      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="disponibilidad" element={<Availability />} />
        <Route path="clientes" element={<ClientHistory />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
