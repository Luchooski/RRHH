import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import DashboardPage from '../features/dashboard/DashboardPage';
import CandidatesPage from '../features/candidates/CandidatePage';
import InterviewsPage from '../features/interviews/InterviewsPage';
import UploadCVPage from '../features/uploads/UploadCVPage';
import EmployeesPage from '../features/employees/EmployeesPage';
import PayrollPage from '../features/payroll/PayrollPage';
import SchedulesPage from '../features/schedules/SchedulesPage';
import NotFound from '../pages/NotFound';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'candidatos', element: <CandidatesPage /> },
      { path: 'entrevistas', element: <InterviewsPage /> },
      { path: 'cargar-cv', element: <UploadCVPage /> },
      { path: 'empleados', element: <EmployeesPage /> },
      { path: 'liquidaciones', element: <PayrollPage /> },
      { path: 'horarios', element: <SchedulesPage /> },
      // Solo mantenemos la ruta /historial por compatibilidad, muestra Dashboard
      { path: 'historial', element: <DashboardPage /> },
      { path: '*', element: <NotFound /> }
    ]
  }
]);

export default router;
