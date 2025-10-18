import { NavLink } from 'react-router-dom';

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  collapsed?: boolean;
  onClick?: () => void;
  badge?: string | number;
}

export default function SidebarItem({ 
  to, 
  icon, 
  children, 
  collapsed = false,
  onClick,
  badge 
}: SidebarItemProps) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => `
        flex items-center gap-3 rounded-lg px-3 py-2.5
        text-sm font-medium transition-colors
        ${isActive
          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400'
          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
        }
        ${collapsed ? 'justify-center' : ''}
      `}
      title={collapsed ? String(children) : undefined}
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && (
        <span className="flex-1 truncate">{children}</span>
      )}
      {!collapsed && badge && (
        <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
          {badge}
        </span>
      )}
    </NavLink>
  );
}