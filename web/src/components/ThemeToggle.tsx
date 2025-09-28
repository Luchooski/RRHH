import { useContext } from 'react';
import { ThemeCtx } from '../app/ThemeProvider';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, setTheme } = useContext(ThemeCtx);
  const isDark = theme === 'dark';
  return (
    <button className="btn inline-flex items-center gap-2" aria-label="Cambiar tema"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}>
      {isDark ? <Sun size={16} /> : <Moon size={16} />}

    </button>
  );
}
