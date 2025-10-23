import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import App from './App';
import { useAuth } from '../features/auth/auth';
import LoginPage from '../features/auth/LoginPage';
import ForgotPasswordPage from '../features/auth/ForgotPasswordPage';
import ResetPasswordPage from '../features/auth/ResetPasswordPage';

// Dashboard
import DashboardPage from '../features/dashboard/DashboardPage';
import AnalyticsDashboardPage from '../features/analytics/DashboardPage';

// Candidatos (NUEVOS imports correctos)
import CandidatesPage from '@/features/candidates/CandidatePage';
import CandidateDetailPage from '@/features/candidates/CandidateDetailPage';
import CandidateCreatePage from '@/features/candidates/CandidateCreatePage';
import CandidateEditPage from '@/features/candidates/CandidateEditPage';

// Entrevistas
import InterviewsPage from '../features/interviews/InterviewsPage';
import CalendarPage from '@/features/interviews/CalendarPage';

// Subir CV
import UploadCVPage from '../features/uploads/UploadCVPage';

// Empleados
import EmployeesPage from '../features/employees/EmployeesPage';
import EmployeeCreatePage from '../features/employees/EmployeeCreatePage';

// Licencias
import LeavesManagementPage from '../features/leaves/LeavesManagementPage';
import LeaveRequestPage from '../features/leaves/LeaveRequestPage';

// Asistencias
import AttendanceReportsPage from '../features/attendance/AttendanceReportsPage';
import AttendanceTrackingPage from '../features/attendance/AttendanceTrackingPage';

// Beneficios
import BenefitsManagementPage from '../features/benefits/BenefitsManagementPage';
import EmployeeBenefitsPage from '../features/benefits/EmployeeBenefitsPage';

// Liquidaciones
import PayrollPage from '../features/payroll/PayrollPage';

// Horarios
import SchedulesPage from '../features/schedules/SchedulesPage';

// Vacantes
import VacanciesPage from '@/features/vacancies/VacanciesPage';
import VacancyPipelinePage from '@/features/pipeline/VacancyPipelinePage';
import VacancyDetailPage from '@/features/vacancies/VacancyDetailPage';
import VacancyCreatePage from '@/features/vacancies/VacancyCreatePage';
import VacancyEditPage from '@/features/vacancies/VacancyEditPage';

// Reportes
import ReportsPage from '@/features/reports/ReportsPage';

// Clientes
import ClientsPage from '../features/clients/ClientsPage';
import ClientCreatePage from '@/features/clients/ClientCreatePage';
import ClientEditPage from '@/features/clients/ClientEditPage';

// Tenant Registration
import { TenantRegister } from '../pages/TenantRegister';

// Employee Portal
import { EmployeeLayout } from '../pages/employee-portal/EmployeeLayout';
import { EmployeeProfile } from '../pages/employee-portal/EmployeeProfile';
import { EmployeePayrolls } from '../pages/employee-portal/EmployeePayrolls';
import { EmployeeDocuments } from '../pages/employee-portal/EmployeeDocuments';

// Public Careers
import { CareersPage } from '../pages/CareersPage';

// Tenant Settings
import { TenantSettings } from '../pages/TenantSettings';

// RBAC
import RolesManagementPage from '../features/rbac/RolesManagementPage';
import PermissionsViewerPage from '../features/rbac/PermissionsViewerPage';

// 404
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

function EmployeeProtectedLayout() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6">Cargando sesión…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'employee') return <Navigate to="/" replace />;
  return <EmployeeLayout />;
}

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      { path: '/register', element: <TenantRegister /> },
      { path: '/careers/:companySlug', element: <CareersPage /> },
    ]
  },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <DashboardPage /> },

      // Candidatos — limpio y completo
      { path: 'candidatos', element: <CandidatesPage /> },
      { path: 'candidatos/nuevo', element: <CandidateCreatePage /> },
      { path: 'candidatos/nuevos', element: <Navigate to="/candidatos/nuevo" replace /> }, // compatibilidad
      { path: 'candidatos/:id', element: <CandidateDetailPage /> },
      { path: 'candidatos/:id/editar', element: <CandidateEditPage /> },


      // Entrevistas / Agenda
      { path: 'entrevistas', element: <InterviewsPage /> },
      { path: 'agenda', element: <CalendarPage /> },

      // Subir CV
      { path: 'cargar-cv', element: <UploadCVPage /> },

      // Empleados / Liquidaciones / Horarios
      { path: 'empleados', element: <EmployeesPage /> },
      { path: 'empleados/nuevo', element: <EmployeeCreatePage /> },
      { path: 'licencias', element: <LeavesManagementPage /> },
      { path: 'asistencias', element: <AttendanceReportsPage /> },
      { path: 'beneficios', element: <BenefitsManagementPage /> },
      { path: 'liquidaciones', element: <PayrollPage /> },
      { path: 'horarios', element: <SchedulesPage /> },

      // Clientes
      { path: 'clientes', element: <ClientsPage /> },
      { path: 'clientes/nuevo', element: <ClientCreatePage /> },
      { path: 'clientes/:id', element: <ClientEditPage /> },

      // Vacantes
      { path: 'vacantes', element: <VacanciesPage /> },
      { path: 'vacantes/nueva', element: <VacancyCreatePage /> },
      { path: 'vacantes/:id', element: <VacancyDetailPage /> },
      { path: 'vacantes/:id/editar', element: <VacancyEditPage /> },
      { path: 'vacantes/:id/pipeline', element: <VacancyPipelinePage /> },

      // Reportes
      { path: 'reportes', element: <ReportsPage /> },

      // Analíticas
      { path: 'analiticas', element: <AnalyticsDashboardPage /> },

      // Configuración de Empresa
      { path: 'configuracion', element: <TenantSettings /> },

      // RBAC - Roles y Permisos
      { path: 'roles', element: <RolesManagementPage /> },
      { path: 'mis-permisos', element: <PermissionsViewerPage /> },

      // Historial (placeholder, si querés una página dedicada)
      { path: 'historial', element: <DashboardPage /> },

      // 404
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    path: '/employee',
    element: <EmployeeProtectedLayout />,
    children: [
      { index: true, element: <EmployeeProfile /> },
      { path: 'payrolls', element: <EmployeePayrolls /> },
      { path: 'documents', element: <EmployeeDocuments /> },
      { path: 'leaves', element: <LeaveRequestPage /> },
      { path: 'attendance', element: <AttendanceTrackingPage /> },
      { path: 'benefits', element: <EmployeeBenefitsPage /> },
    ],
  },
]);

export default router;
