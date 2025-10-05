import { useEffect, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { applyTheme, getTheme, setTheme, subscribeSystemTheme, type Theme } from '@/lib/Theme';

const NEXT: Record<Theme, Theme> = { light: 'dark', dark: 'system', system: 'light' };

export default function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>(() => getTheme());

  useEffect(() => {
    // Aplicar el tema actual al montar
    applyTheme(theme);
    // Si está en "system", re-aplicar al cambiar preferencia del SO
    const off = subscribeSystemTheme(() => {
      if (theme === 'system') applyTheme('system');
    });
    return off;
  }, [theme]);

  const cycle = () => {
    const next = NEXT[theme];
    setThemeState(next);
    setTheme(next);
  };

  const label =
    theme === 'light' ? 'Tema claro'
    : theme === 'dark' ? 'Tema oscuro'
    : 'Tema del sistema';

  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  return (
    <button
      type="button"
      onClick={cycle}
      className="tw-btn tw-btn-ghost w-10 justify-center"
      aria-label={`Cambiar tema (actual: ${label})`}
      title={`Cambiar tema (actual: ${label})`}
    >
      <Icon size={16} />
    </button>
  );
}
