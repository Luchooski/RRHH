import { Moon, Sun, Monitor } from 'lucide-react';

const THEME_CONFIG = {
  light: { 
    label: 'Tema claro', 
    icon: Sun, 
    next: 'dark' as Theme 
  },
  dark: { 
    label: 'Tema oscuro', 
    icon: Moon, 
    next: 'system' as Theme 
  },
  system: { 
    label: 'Tema del sistema', 
    icon: Monitor, 
    next: 'light' as Theme 
  },
} as const;

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const config = THEME_CONFIG[theme];
  const Icon = config.icon;

  const handleToggle = () => {
    setTheme(config.next);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${className}`}
      aria-label={`Cambiar tema (actual: ${config.label})`}
      title={config.label}
    >
      <Icon size={18} className="shrink-0" />
      {showLabel && <span className="hidden sm:inline">{config.label}</span>}
    </button>
  );
}