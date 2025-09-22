// Helpers del cliente HTTP. No recalcula base; delega en http.ts.
import { http } from './http';

export const fetcher = {
  get:  <T>(path: string) => http<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) => http<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put:  <T>(path: string, body?: unknown) => http<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch:<T>(path: string, body?: unknown) => http<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete:<T>(path: string) => http<T>(path, { method: 'DELETE' }),
};

export const api = fetcher;

export default fetcher;
