export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'mh-theme';

/**
 * Obtiene el tema guardado o retorna 'system' por defecto
 */
export function getTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (saved === 'light' || saved === 'dark' || saved === 'system') {
    return saved;
  }
  return 'system';
}

/**
 * Guarda el tema en localStorage
 */
export function setTheme(theme: Theme): void {
  localStorage.setItem(STORAGE_KEY, theme);
}

/**
 * Detecta si el sistema prefiere tema oscuro
 */
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Resuelve el tema efectivo (convierte 'system' en 'light' o 'dark')
 */
export function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
}

/**
 * Aplica el tema al documento
 */
export function applyTheme(theme: Theme): void {
  const resolved = resolveTheme(theme);
  const root = document.documentElement;
  
  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
  
  // Opcional: actualizar meta theme-color para mobile
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', resolved === 'dark' ? '#18181b' : '#ffffff');
  }
}

/**
 * Suscribe a cambios en la preferencia del sistema
 * Retorna función para cancelar suscripción
 */
export function subscribeSystemTheme(callback: (theme: 'light' | 'dark') => void): () => void {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handler = (e: MediaQueryListEvent | MediaQueryList) => {
    callback(e.matches ? 'dark' : 'light');
  };
  
  // Soporte para navegadores antiguos
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  } else if (mediaQuery.addListener) {
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }
  
  return () => {};
}