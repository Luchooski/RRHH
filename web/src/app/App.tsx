import { Outlet } from 'react-router-dom';
import Topbar from '../components/Topbar';
import { useEffect, useState } from 'react';
import HistoryDrawer from '../features/history/HistoryDrawer';
import SidebarItem from '../components/SidebarItem';
import { Home, Users, CalendarClock, Upload, IdCard, Receipt, Clock3, History } from 'lucide-react';
import SkipLink from '../components/skipLink';
import Breadcrumbs from '../components/Breadcrumbs';

const NAV = [
  { to: '/',             label: 'Dashboard',     icon: <Home size={18}/> },
  { to: '/candidatos',   label: 'Candidatos',    icon: <Users size={18}/> },
  { to: '/entrevistas',  label: 'Entrevistas',   icon: <CalendarClock size={18}/> },
  { to: '/cargar-cv',    label: 'Cargar CV',     icon: <Upload size={18}/> },
  { to: '/empleados',    label: 'Empleados',     icon: <IdCard size={18}/> },
  { to: '/liquidaciones',label: 'Liquidaciones', icon: <Receipt size={18}/> },
  { to: '/horarios',     label: 'Horarios',      icon: <Clock3 size={18}/> },
  { to: '/historial',    label: 'Historial',     icon: <History size={18}/> },
];

const KEY_COLLAPSED = 'mh-side-collapsed';

export default function App() {
  const [openHistory, setOpenHistory] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => localStorage.getItem(KEY_COLLAPSED) === '1');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { localStorage.setItem(KEY_COLLAPSED, collapsed ? '1' : '0'); }, [collapsed]);

  // Cerrar menú móvil con ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-[auto_1fr]">
      <SkipLink />

      {/* SIDEBAR DESKTOP */}
      <aside
        className={[
          'hidden lg:block border-r transition-[width] duration-200',
          'border-zinc-200 dark:border-zinc-800',
          'bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100',
          'p-4',
          collapsed ? 'w-[72px]' : 'w-[240px]',
        ].join(' ')}
        aria-label="Barra lateral"
      >
        <div className={`pb-4 text-lg font-semibold ${collapsed ? 'px-0 text-center' : 'px-2'}`}>
          {collapsed ? 'MH' : 'Match-Hire'}
        </div>

        <nav className="flex flex-col gap-1">
          {NAV.map(item => (
            <SidebarItem key={item.to} to={item.to} icon={item.icon} collapsed={collapsed}>
              {item.label}
            </SidebarItem>
          ))}
        </nav>

        <div className="mt-4">
          <button
            className="btn w-full"
            aria-pressed={collapsed}
            aria-label={collapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
            onClick={() => setCollapsed(v => !v)}
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {collapsed ? '»' : '«'} {collapsed ? '' : 'Colapsar'}
          </button>
        </div>
      </aside>

      {/* OFF-CANVAS MÓVIL */}
      <div
        className={`fixed inset-0 z-[100] lg:hidden ${mobileOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!mobileOpen}
      >
        {/* Fondo */}
        <div
          className={`absolute inset-0 z-[100] bg-black/40 transition-opacity ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMobileOpen(false)}
        />
        {/* Panel */}
        <aside
          className={[
            'absolute left-0 top-0 z-[110] h-full w-[84%] max-w-[320px] p-4 shadow-[0_10px_30px_rgba(0,0,0,.35)]',
            'transition-transform will-change-transform',
            'bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100',
            'border-r border-zinc-200 dark:border-zinc-800',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          ].join(' ')}
          role="dialog"
          aria-modal="true"
          aria-label="Menú móvil"
        >
          <div className="px-2 pb-4 text-lg font-semibold">Match-Hire</div>

          <nav className="flex flex-col gap-1">
            {NAV.map(item => (
              <SidebarItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                collapsed={false}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </SidebarItem>
            ))}
          </nav>

          <button
            className="btn btn-primary mt-4 w-full"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
          >
            Cerrar
          </button>
        </aside>
      </div>

      {/* CONTENIDO */}
      <div className="flex min-h-dvh flex-col">
        <Topbar
          onOpenHistory={() => setOpenHistory(true)}
          onToggleSidebar={() => setMobileOpen(true)}
        />

        <div className="container mt-3">
          <Breadcrumbs />
        </div>

        <main id="main" className="flex-1 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>

        <HistoryDrawer open={openHistory} onClose={() => setOpenHistory(false)} />
      </div>
    </div>
  );
}
