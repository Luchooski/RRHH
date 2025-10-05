// web/src/lib/theme.ts
export type Theme = 'light' | 'dark' | 'system';
const KEY = 'mh_theme';

export function getTheme(): Theme {
  const t = (typeof localStorage !== 'undefined' && localStorage.getItem(KEY)) || 'system';
  return (t === 'light' || t === 'dark' || t === 'system') ? t : 'system';
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
  root.classList.toggle('dark', isDark);
}

export function setTheme(theme: Theme) {
  try { localStorage.setItem(KEY, theme); } catch {}
  applyTheme(theme);
}

/** Reaplica cuando cambia el sistema y el usuario eligió "system" */
export function subscribeSystemTheme(onChange: () => void) {
  const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
  if (!mq) return () => {};
  const handler = () => onChange();
  mq.addEventListener?.('change', handler);
  return () => mq.removeEventListener?.('change', handler);
}
