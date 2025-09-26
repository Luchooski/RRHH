import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import App from './App';
import { useAuth } from '../features/auth/auth';
import LoginPage from '../features/auth/LoginPage';
import DashboardPage from '../features/dashboard/DashboardPage';
import CandidatesPage from '../features/candidates/CandidatePage';
import InterviewsPage from '../features/interviews/InterviewsPage';
import UploadCVPage from '../features/uploads/UploadCVPage';
import EmployeesPage from '../features/employees/EmployeesPage';
import PayrollPage from '../features/payroll/PayrollPage';
import SchedulesPage from '../features/schedules/SchedulesPage';
import NotFound from '../pages/NotFound';

function PublicLayout() {
  return <Outlet />;
}

function ProtectedLayout() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6">Cargando sesión…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <App />; // App debe renderizar <Outlet />
}

const router = createBrowserRouter([
  { element: <PublicLayout />, children: [{ path: '/login', element: <LoginPage /> }] },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'candidatos', element: <CandidatesPage /> },
      { path: 'entrevistas', element: <InterviewsPage /> },
      { path: 'cargar-cv', element: <UploadCVPage /> },
      { path: 'empleados', element: <EmployeesPage /> },
      { path: 'liquidaciones', element: <PayrollPage /> },
      { path: 'horarios', element: <SchedulesPage /> },
      { path: 'historial', element: <DashboardPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export default router;