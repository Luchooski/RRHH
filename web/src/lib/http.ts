// web/src/lib/http.ts
export type HttpOptions = RequestInit & { auth?: boolean };

const rawBase = (import.meta.env.VITE_API_URL || '').trim();
const API_BASE = (rawBase || 'http://localhost:4000').replace(/\/+$/, '');

const AUTH_MODE = (import.meta.env.VITE_AUTH_MODE || 'bearer').toLowerCase() as
  | 'bearer'
  | 'cookie';

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

function attachAuthHeaders(headers: Record<string, string>, opts: HttpOptions) {
  if (opts.auth) {
    if (AUTH_MODE === 'bearer' && __token) {
      headers.Authorization = `Bearer ${__token}`;
    }
    // en modo cookie no seteamos header; usamos credentials: 'include'
  }
}

function parseMaybeJson(text: string | null) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    // si no es JSON, devolver texto crudo
    return text;
  }
}

async function request<T>(path: string, opts: HttpOptions): Promise<T> {
  const url = buildUrl(path);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(opts.headers as any),
  };

  // Sólo Content-Type JSON si hay body
  const hasBody = opts.body != null;
  if (hasBody && !('Content-Type' in headers)) {
    headers['Content-Type'] = 'application/json';
  }

  attachAuthHeaders(headers, opts);

  const fetchOpts: RequestInit = {
    ...opts,
    headers,
    // si usamos cookies httpOnly, necesitamos credenciales
    credentials: AUTH_MODE === 'cookie' && opts.auth ? 'include' : opts.credentials,
  };

  const res = await fetch(url, fetchOpts);

  if (res.status === 401 && __onUnauthorized) {
    try {
      __onUnauthorized();
    } catch {}
  }

  // 204 No Content
  if (res.status === 204) {
    return null as unknown as T;
  }

  const text = await res.text();
  const data = parseMaybeJson(text);

  if (!res.ok) {
    const message =
      (data && (data.error?.message || (typeof data === 'string' ? data : data.message))) ||
      `HTTP ${res.status}`;
    const err = new Error(message) as any;
    err.status = res.status;
    err.details = (data && (data.error?.details ?? data)) || null;
    throw err;
  }

  return data as T;
}

async function requestBlob(path: string, opts: HttpOptions): Promise<Blob> {
  const url = buildUrl(path);
  const headers: Record<string, string> = {
    ...(opts.headers as any),
  };

  attachAuthHeaders(headers, opts);

  const res = await fetch(url, {
    ...opts,
    headers,
    credentials: AUTH_MODE === 'cookie' && opts.auth ? 'include' : opts.credentials,
  });

  if (res.status === 401 && __onUnauthorized) {
    try {
      __onUnauthorized();
    } catch {}
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

// Compat
export function apiUrl(path: string = '') {
  return buildUrl(path || '/');
}

// Exponer modo auth por si hace falta en UI
export const authMode = AUTH_MODE;
