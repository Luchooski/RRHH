import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/auth';
import { useEffect } from 'react';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Guardar la última ubicación visitada
    if (user && !loading) {
      sessionStorage.setItem('lastVisitedPath', location.pathname);
    }
  }, [location.pathname, user, loading]);

  // Loading state mejorado
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Verificando sesión...
          </p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}