import ThemeToggle from './ThemeToggle';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, History, LogOut } from 'lucide-react';
import { useAuth } from '../features/auth/auth';

export default function Topbar({
  onOpenHistory,
  onToggleSidebar,
}: {
  onOpenHistory?: () => void;
  onToggleSidebar?: () => void;
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const title =
    pathname.startsWith('/candidatos') ? 'Candidatos' :
    pathname.startsWith('/entrevistas') ? 'Entrevistas' :
    pathname.startsWith('/cargar-cv') ? 'Cargar CV' :
    pathname.startsWith('/empleados') ? 'Empleados' :
    pathname.startsWith('/liquidaciones') ? 'Liquidaciones' :
    pathname.startsWith('/horarios') ? 'Horarios' :
    pathname.startsWith('/historial') ? 'Historial' : 'Dashboard';

  return (
    <header className="sticky top-0 z-10 bg-[--color-bg]/70 backdrop-blur border-b border-[--color-border] dark:border-zinc-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Hamburguesa visible en móviles */}
          <button
            className="btn lg:hidden"
            aria-label="Abrir menú"
            onClick={onToggleSidebar}
          >
            <Menu size={18} />
          </button>
          <h2 className="text-sm text-[--color-muted]">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          
          {user && (
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground mr-1">
              <span>{user.email}</span>
            </div>
          )}
          {onOpenHistory && (
            <>
              {/* Móvil: icono */}
              <button className="btn sm:hidden" aria-label="Ver historial" onClick={onOpenHistory}>
                <History size={18} />
              </button>
              {/* ≥sm: botón con texto */}

            </>
          )}
          <ThemeToggle />
          {user && (
            <button
              className="btn btn-outline inline-flex items-center gap-2"
              onClick={async () => {                      // ← async handler
                await logout();                           // ← esperar a que el server borre cookie
                navigate('/login', { replace: true });
              }}
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
