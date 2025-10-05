import { NavLink } from 'react-router-dom';
import ThemeToggle from '@/components/ThemeToggle';

type Props = { children: React.ReactNode };

const navItems = [
  { to: '/candidates', label: 'Candidatos' },
  { to: '/employees',  label: 'Empleados'  },
  { to: '/payroll',    label: 'Liquidaciones' },
];

export default function AppLayout({ children }: Props) {
  return (
    <>
      {/* Skip link para a11y */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-zinc-900 focus:px-3 focus:py-2 focus:text-white dark:focus:bg-zinc-100 dark:focus:text-zinc-900"
      >
        Saltar al contenido
      </a>

      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-zinc-800 dark:bg-zinc-900/70">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
              {/* Logo simple */}
              <span className="text-xs font-black">RH</span>
            </div>
            <nav className="hidden gap-1 sm:flex">
              {navItems.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={({ isActive }) =>
                    [
                      'rounded-lg px-3 py-2 text-sm font-semibold transition',
                      isActive
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
                    ].join(' ')
                  }
                >
                  {n.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {/* Placeholder usuario */}
            <div
              title="Usuario"
              className="hidden h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-xs font-bold text-white sm:flex"
            >
              U
            </div>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <div id="main" className="mx-auto max-w-7xl p-4">
        {children}
      </div>

      {/* Footer mínimo */}
      <footer className="mt-12 border-t border-zinc-200 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        RRHH • Demo • {new Date().getFullYear()}
      </footer>
    </>
  );
}
