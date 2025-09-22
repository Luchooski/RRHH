let TOKEN: string | null = null;

export function setToken(t: string | null) {
  TOKEN = t;
  if (t) localStorage.setItem('token', t);
  else localStorage.removeItem('token');
}
export function getToken() {
  if (TOKEN) return TOKEN;
  TOKEN = localStorage.getItem('token');
  return TOKEN;
}

// Base URL robusta (usa VITE_API_URL o fallback a :4000 en dev)
const RAW = (import.meta as any)?.env?.VITE_API_URL as string | undefined;
const DEV_GUESS =
  typeof window !== 'undefined' && window.location?.port === '5173'
    ? 'http://localhost:4000'
    : '';
const API_BASE = (RAW && RAW.trim().replace(/\/+$/, '')) || DEV_GUESS;

function buildUrl(path: string) {
  if (!path.startsWith('/')) path = '/' + path;
  return API_BASE ? `${API_BASE}${path}` : path;
}

// Permite que AuthProvider instale un callback para 401
let onUnauthorized: (() => void) | null = null;
export function setOnUnauthorized(cb: (() => void) | null) {
  onUnauthorized = cb;
}

export async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const url = buildUrl(path);
  // console.debug('[http]', { url, API_BASE, path, hasToken: !!token });

  const res = await fetch(url, { ...init, headers });
  // Intentamos parsear JSON, si falla devolvemos texto
  const text = await res.text().catch(() => '');
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = text; }

  if (!res.ok) {
    if (res.status === 401 && onUnauthorized) onUnauthorized(); // 🔒
    const msg =
      (data && typeof data === 'object' && data.error?.message) ||
      `HTTP ${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return data as T;
}
