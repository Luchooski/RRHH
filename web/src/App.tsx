import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Home, BarChart3, Users, CalendarClock, CalendarDays,
  Upload, IdCard, Receipt, Briefcase, Building2, Clock3,
  History, ChevronLeft, ChevronRight, Palmtree
} from 'lucide-react';
import Topbar from '@/components/Topbar';
import HistoryDrawer from '@/features/history/HistoryDrawer';
import SidebarItem from '@/components/SidebarItem';
import SkipLink from '@/components/skipLink';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

const STORAGE_KEY_COLLAPSED = 'mh-sidebar-collapsed';
const STORAGE_KEY_MOBILE = 'mh-sidebar-mobile';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: <Home size={18} /> },
  { to: '/candidatos', label: 'Candidatos', icon: <Users size={18} /> },
  { to: '/entrevistas', label: 'Entrevistas', icon: <CalendarClock size={18} /> },
  { to: '/agenda', label: 'Agenda', icon: <CalendarDays size={18} /> },
  { to: '/vacantes', label: 'Vacantes', icon: <Briefcase size={18} /> },
  { to: '/clientes', label: 'Clientes', icon: <Building2 size={18} /> },
  { to: '/cargar-cv', label: 'Cargar CV', icon: <Upload size={18} /> },
  { to: '/empleados', label: 'Empleados', icon: <IdCard size={18} /> },
  { to: '/licencias', label: 'Licencias', icon: <Palmtree size={18} /> },
  { to: '/liquidaciones', label: 'Liquidaciones', icon: <Receipt size={18} /> },
  { to: '/horarios', label: 'Horarios', icon: <Clock3 size={18} /> },
  { to: '/reportes', label: 'Reportes', icon: <BarChart3 size={18} /> },
  { to: '/historial', label: 'Historial', icon: <History size={18} /> },
];

function getStoredBoolean(key: string, defaultValue: boolean): boolean {
  try {
    const stored = localStorage.getItem(key);
    return stored ? stored === '1' : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStoredBoolean(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, value ? '1' : '0');
  } catch (error) {
    console.warn('Error saving to localStorage:', error);
  }
}

export default function App() {
  const [collapsed, setCollapsed] = useState(() => 
    getStoredBoolean(STORAGE_KEY_COLLAPSED, false)
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Persist collapsed state
  useEffect(() => {
    setStoredBoolean(STORAGE_KEY_COLLAPSED, collapsed);
  }, [collapsed]);

  // Close mobile menu on ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [mobileOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <SkipLink />

      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden lg:flex flex-col
          border-r border-gray-200 dark:border-gray-800
          bg-white dark:bg-gray-900
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-20' : 'w-64'}
        `}
        aria-label="Navegación principal"
      >
        {/* Logo/Brand */}
        <div className={`
          flex items-center justify-between
          h-16 px-4 border-b border-gray-200 dark:border-gray-800
        `}>
          <div className={`
            font-bold text-xl text-gray-900 dark:text-gray-100
            transition-opacity duration-200
            ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}
          `}>
            Match-Hire
          </div>
          {collapsed && (
            <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
              MH
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Menú principal">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <SidebarItem
                  to={item.to}
                  icon={item.icon}
                  collapsed={collapsed}
                  badge={item.badge}
                >
                  {item.label}
                </SidebarItem>
              </li>
            ))}
          </ul>
        </nav>

        {/* Collapse Toggle */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`
              w-full flex items-center justify-center gap-2
              px-4 py-2.5 rounded-lg
              text-sm font-medium
              text-gray-700 dark:text-gray-300
              hover:bg-gray-100 dark:hover:bg-gray-800
              transition-colors
            `}
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {collapsed ? (
              <ChevronRight size={18} />
            ) : (
              <>
                <ChevronLeft size={18} />
                <span>Colapsar</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64
          transform transition-transform duration-300 ease-in-out
          bg-white dark:bg-gray-900
          border-r border-gray-200 dark:border-gray-800
          lg:hidden
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        aria-label="Navegación móvil"
        role="dialog"
        aria-modal="true"
      >
        {/* Logo/Brand */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-800">
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Match-Hire
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Cerrar menú"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="overflow-y-auto px-3 py-4" aria-label="Menú móvil">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <SidebarItem
                  to={item.to}
                  icon={item.icon}
                  collapsed={false}
                  onClick={() => setMobileOpen(false)}
                  badge={item.badge}
                >
                  {item.label}
                </SidebarItem>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar
          onOpenHistory={() => setHistoryOpen(true)}
          onToggleSidebar={() => setMobileOpen(true)}
        />

        {/* Breadcrumbs */}
        <div className="border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Breadcrumbs />
          </div>
        </div>

        {/* Page Content */}
        <main 
          id="main" 
          className="flex-1 px-4 py-6 sm:px-6 lg:px-8"
          role="main"
        >
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>

        {/* Footer (opcional) */}
        <footer className="border-t border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto max-w-7xl">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              © {new Date().getFullYear()} Match-Hire. Todos los derechos reservados.
            </p>
          </div>
        </footer>
      </div>

      {/* History Drawer */}
      <HistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}
