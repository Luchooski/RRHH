import { Menu, History, LogOut, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/auth';
import ThemeToggle from './ThemeToggle';
import NotificationBell from '@/features/notifications/NotificationBell';


interface TopbarProps {
  onOpenHistory?: () => void;
  onToggleSidebar?: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/candidatos': 'Candidatos',
  '/entrevistas': 'Entrevistas',
  '/cargar-cv': 'Cargar CV',
  '/empleados': 'Empleados',
  '/licencias': 'Licencias',
  '/liquidaciones': 'Liquidaciones',
  '/horarios': 'Horarios',
  '/historial': 'Historial',
  '/clientes': 'Clientes',
  '/vacantes': 'Vacantes',
  '/agenda': 'Agenda',
  '/reportes': 'Reportes',
};

function getPageTitle(pathname: string): string {
  // Buscar coincidencia exacta
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  
  // Buscar por prefijo
  const match = Object.entries(PAGE_TITLES).find(([path]) => 
    pathname.startsWith(path) && path !== '/'
  );
  
  return match ? match[1] : 'Dashboard';
}

export default function Topbar({ onOpenHistory, onToggleSidebar }: TopbarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const title = getPageTitle(pathname);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left section */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h1>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* User info - hidden on mobile */}
          {user && (
            <div className="hidden items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 dark:bg-gray-800 md:flex">
              <User size={16} className="text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {user.email}
              </span>
            </div>
          )}

          {/* History button */}
          {onOpenHistory && (
            <button
              onClick={onOpenHistory}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="Ver historial"
            >
              <History size={18} />
              <span className="hidden sm:inline">Historial</span>
            </button>
          )}

          {/* Notifications */}
          {user && <NotificationBell />}

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Logout button */}
          {user && (
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              title="Cerrar sesión"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}