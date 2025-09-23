// web/src/lib/http.ts
type HttpOptions = RequestInit & { auth?: boolean };

const rawBase = (import.meta.env.VITE_API_URL || '').trim();
const API_BASE = (rawBase || 'http://localhost:4000').replace(/\/+$/, '');

// Logs de diagnóstico (aparecen una sola vez)
console.log('[HTTP] import.meta.env snapshot (recortado):', {
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
  VITE_API_URL: import.meta.env.VITE_API_URL,
});
if (!rawBase) {
  console.warn(
    '[HTTP] VITE_API_URL no definido. Usando fallback http://localhost:4000. ' +
    'Creá /web/.env con VITE_API_URL y reiniciá Vite para evitar este warning.'
  );
}
console.log('[HTTP] API_BASE =', API_BASE);

const TOKEN_KEY = 'auth_token';

export function setToken(token: string | null) {
  if (!token) localStorage.removeItem(TOKEN_KEY);
  else localStorage.setItem(TOKEN_KEY, token);
}
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

let onUnauthorized: (() => void) | null = null;
export function setOnUnauthorized(cb: (() => void) | null) {
  onUnauthorized = cb || null;
}

export function apiUrl(path: string) {
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path}`;
}

async function request<T>(path: string, opts: HttpOptions = {}): Promise<T> {
  const url = apiUrl(path);
  const headers = new Headers(opts.headers || {});
  const token = getToken();

  const shouldAuth = opts.auth !== false;
  if (shouldAuth && token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && opts.body) headers.set('Content-Type', 'application/json');

  console.debug('[HTTP]', opts.method || 'GET', url, { hasToken: !!token });

  const res = await fetch(url, { ...opts, headers });
  // Log de resultado (una línea)
  console.debug('[HTTP:res]', res.status, res.statusText, url);

  if (res.status === 401) {
    onUnauthorized?.();
    throw new Error('UNAUTHORIZED');
  }
  if (!res.ok) {
    let text = '';
    try { text = await res.text(); } catch {}
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  const data = (await res.json()) as T;
  return data;
}

export const http = {
  get:   <T>(path: string, opts?: HttpOptions) => request<T>(path, { ...opts, method: 'GET' }),
  post:  <T>(path: string, body?: unknown, opts?: HttpOptions) =>
    request<T>(path, { ...opts, method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put:   <T>(path: string, body?: unknown, opts?: HttpOptions) =>
    request<T>(path, { ...opts, method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown, opts?: HttpOptions) =>
    request<T>(path, { ...opts, method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete:<T>(path: string, opts?: HttpOptions) =>
    request<T>(path, { ...opts, method: 'DELETE' }),
};
