// web/src/lib/http.ts
export type HttpOptions = RequestInit & { auth?: boolean };

const rawBase = (import.meta.env.VITE_API_URL || '').trim();
const API_BASE = (rawBase || 'http://localhost:4000').replace(/\/+$/, '');

let __token: string | null =
  (typeof localStorage !== 'undefined' && localStorage.getItem('auth_token')) || null;
let __onUnauthorized: null | (() => void) = null;

export function setToken(t: string | null) {
  __token = t;
  if (typeof localStorage !== 'undefined') {
    if (t) localStorage.setItem('auth_token', t);
    else localStorage.removeItem('auth_token');
  }
}

export function onUnauthorized(cb: (() => void) | null) {
  __onUnauthorized = cb;
}

function buildUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path; // ya es absoluta
  const left = API_BASE;
  const right = path.startsWith('/') ? path : `/${path}`;
  return `${left}${right}`;
}

async function request<T>(path: string, opts: HttpOptions): Promise<T> {
  const url = buildUrl(path);
  const headers: Record<string, string> = {
    ...(opts.headers as any),
  };

  // Solo fijar Content-Type JSON si realmente enviamos body
  const hasBody = opts.body != null;
  if (hasBody && !('Content-Type' in headers)) {
    headers['Content-Type'] = 'application/json';
  }

  if (opts.auth && __token) {
    headers.Authorization = `Bearer ${__token}`;
  }

  const res = await fetch(url, { ...opts, headers });

  if (res.status === 401 && __onUnauthorized) {
    try { __onUnauthorized(); } catch {}
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = (data && (data.error?.message || data.message)) || `HTTP ${res.status}`;
    const err = new Error(message) as any;
    err.status = res.status;
    err.details = data?.error?.details ?? data;
    throw err;
  }

  return data as T;
}

async function requestBlob(path: string, opts: HttpOptions): Promise<Blob> {
  const url = buildUrl(path);
  const headers: Record<string, string> = {
    ...(opts.headers as any),
  };
  if (opts.auth && __token) {
    headers.Authorization = `Bearer ${__token}`;
  }
  const res = await fetch(url, { ...opts, headers });
  if (res.status === 401 && __onUnauthorized) {
    try { __onUnauthorized(); } catch {}
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.blob();
}

export const http = {
  get:   <T>(path: string, opts?: HttpOptions) => request<T>(path, { ...opts, method: 'GET' }),
  post:  <T>(path: string, body?: unknown, opts?: HttpOptions) =>
    request<T>(path, { ...opts, method: 'POST', body: body != null ? JSON.stringify(body) : undefined }),
  put:   <T>(path: string, body?: unknown, opts?: HttpOptions) =>
    request<T>(path, { ...opts, method: 'PUT', body: body != null ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown, opts?: HttpOptions) =>
    request<T>(path, { ...opts, method: 'PATCH', body: body != null ? JSON.stringify(body) : undefined }),
  delete:<T>(path: string, opts?: HttpOptions) =>
    request<T>(path, { ...opts, method: 'DELETE' }),
  blob:  (path: string, opts?: HttpOptions) => requestBlob(path, { ...opts, method: 'GET' }),
};

// Compat (por si alguien lo usa)
export function apiUrl(path: string = '') {
  return buildUrl(path || '/');
}