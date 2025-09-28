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

export function setOnUnauthorized(fn: (() => void) | null) {
  __onUnauthorized = fn;
}

function buildUrl(path: string) {
  const p = path.startsWith('/') ? path : '/' + path;
  return API_BASE + p;
}

async function request<T>(path: string, opts: HttpOptions = {}): Promise<T> {
  const headers = new Headers(opts.headers || {});
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');

  const hasBodyMethod =
    (opts.method && !['GET', 'HEAD'].includes(opts.method)) || opts.body != null;
  if (!headers.has('Content-Type') && hasBodyMethod) {
    headers.set('Content-Type', 'application/json');
  }

  const useAuth = opts.auth !== false;
  if (useAuth && __token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${__token}`);
  }

  const res = await fetch(buildUrl(path), {
    ...opts,
    headers,
    credentials: 'include',
    cache: 'no-store',
  }).catch((err) => {
    throw new Error(`NETWORK_ERROR: ${err?.message || String(err)}`);
  });

  if (res.status === 401) {
    __onUnauthorized?.();
    throw new Error('UNAUTHORIZED');
  }

  const text = await res.text();
  const json = text ? (() => { try { return JSON.parse(text); } catch { return null; } })() : null;

  if (!res.ok) {
    const msg = (json && (json.error?.message || json.message)) || `HTTP_${res.status}`;
    const code = (json && (json.error?.code || json.code)) || 'HTTP_ERROR';
    const error = new Error(`${code}: ${msg}`);
    (error as any).status = res.status;
    (error as any).body = json ?? text;
    throw error;
  }

  return (json ?? (undefined as any)) as T;
}

async function requestBlob(path: string, opts: HttpOptions = {}): Promise<Blob> {
  const headers = new Headers(opts.headers || {});
  const useAuth = opts.auth !== false;
  if (useAuth && __token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${__token}`);
  }
  const res = await fetch(buildUrl(path), {
    ...opts,
    headers,
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`HTTP_${res.status}`);
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

// ← Export de compatibilidad para imports existentes:
export const apiUrl = API_BASE;
