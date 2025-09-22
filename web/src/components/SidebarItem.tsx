import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';

export default function SidebarItem({
  to,
  icon,
  children,
  collapsed
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  collapsed: boolean;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          'group relative flex items-center gap-3 h-10 rounded-xl px-3',
          isActive
            ? 'bg-[--color-primary]/10 text-[--color-primary]'
            : 'hover:bg-black/5 dark:hover:bg-white/5'
        )
      }
    >
      <span aria-hidden className="shrink-0">{icon}</span>
      {/* etiqueta oculta en colapsado */}
       <span
        className={clsx(
          'text-sm font-medium transition-opacity text-[--color-fg]',
          collapsed ? 'opacity-0 pointer-events-none absolute left-12' : 'opacity-100'
        )}
              >
        {children}
      </span>
      {/* tooltip cuando está colapsado */}
      {collapsed && (
        <span
          role="tooltip"
          className="tooltip hidden group-hover:block"
        >
          {children}
        </span>
      )}
    </NavLink>
  );
}
