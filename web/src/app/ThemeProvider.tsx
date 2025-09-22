import { createContext, useEffect, useState } from 'react';

export const ThemeCtx = createContext({
  theme: 'light' as 'light' | 'dark',
  setTheme: (_: 'light' | 'dark') => {}
});

// Prefiere sistema si no hay preferencia guardada
function getInitialTheme(): 'light' | 'dark' {
  const saved = localStorage.getItem('mh-theme') as 'light' | 'dark' | null;
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('mh-theme', theme);
  }, [theme]);

  // Reacciona a cambios del sistema si el usuario no eligió manualmente
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const saved = localStorage.getItem('mh-theme');
      if (!saved) setTheme(mq.matches ? 'dark' : 'light');
    };
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  return <ThemeCtx.Provider value={{ theme, setTheme }}>{children}</ThemeCtx.Provider>;
}
