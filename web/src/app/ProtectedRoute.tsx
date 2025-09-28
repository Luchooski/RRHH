import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/auth';
import { useToast } from '../components/ui/Toast';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const { push } = useToast();
  const loc = useLocation();

  if (loading) return <div className="p-6">Cargando…</div>;

  if (!user) {
    push({ kind: 'info', message: 'Necesitás iniciar sesión.' });
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }
  return <Outlet />;
}
