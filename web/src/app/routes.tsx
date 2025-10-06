import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import App from './App';
import { useAuth } from '../features/auth/auth';
import LoginPage from '../features/auth/LoginPage';
//Dashboard
import DashboardPage from '../features/dashboard/DashboardPage';
//Candidatos
import CandidatesPage from '../features/candidates/CandidatePage';
//Entrevistas
import InterviewsPage from '../features/interviews/InterviewsPage';
import CalendarPage from '@/features/interviews/CalendarPage.tsx';
//subir CV
import UploadCVPage from '../features/uploads/UploadCVPage';
//Empleados
import EmployeesPage from '../features/employees/EmployeesPage';
//Liquidacioens
import PayrollPage from '../features/payroll/PayrollPage';
//Horarios
import SchedulesPage from '../features/schedules/SchedulesPage';
//Vacantes
import VacanciesPage from '../features/vacancies/VacanciesPage.tsx';
import VacancyPipelinePage from '@/features/pipeline/VacancyPipelinePage';
import InterviewsAgendaPage from '@/features/calendar/InterviewAgendaPage';
import VacancyDetailPage from '@/features/vacancies/VacancyDetailPage';
import VacancyCreatePage from '@/features/vacancies/VacancyCreatePage.tsx';
import VacancyEditPage from '@/features/vacancies/VacancyEditPage.tsx';

//Reportes
import ReportsPage from '@/features/reports/ReportsPage';

//Clientes
import ClientsPage from '../features/clients/ClientsPage.tsx';
import ClientCreatePage from '@/features/clients/ClientCreatePage';
import ClientEditPage from '@/features/clients/ClientEditPage';

//404 No encontrada
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
      { path: 'clientes', element: <ClientsPage /> },
      { path: 'clientes/nuevo', element: <ClientCreatePage /> },
      { path: 'clientes/:id', element: <ClientEditPage /> },
      { path: 'vacantes', element: <VacanciesPage /> },
      { path: 'vacantes/nueva', element: <VacancyCreatePage /> },
      { path: 'vacantes/:id', element: <VacancyDetailPage /> },
      { path: 'vacantes/:id/editar', element: <VacancyEditPage /> },
      { path: 'vacantes/:id/pipeline', element: <VacancyPipelinePage /> },
      { path: 'agenda', element: <CalendarPage /> },
      { path: 'reportes', element: <ReportsPage /> },
      { path: 'horarios', element: <SchedulesPage /> },
      { path: 'historial', element: <DashboardPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export default router;