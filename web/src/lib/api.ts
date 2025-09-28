// web/src/lib/api.ts
import { http, setToken } from './http';

export type LoginBody = { email: string; password: string };
export type LoginRes = { token: string };

export const api = {
  // Auth
  login: (body: LoginBody) => http.post<LoginRes>('/api/v1/auth/login', body),
  me: () => http.get<{ id: string; email: string; role: string }>('/api/v1/auth/me', { auth: true }),
  logout: async () => {
    try {
      await http.post<{ ok: boolean }>('/api/v1/auth/logout', undefined, { auth: true });
    } catch {
      // Ignorar; igual limpiamos el token abajo
    } finally {
      setToken(null);
    }
  },

  // Ejemplos de otros recursos (ajusta según tus rutas reales)
  employees: {
    list: () => http.get<any[]>('/api/v1/employees', { auth: true }),
  },
  candidates: {
    list: (qs = 'limit=20&skip=0') => http.get<any[]>(`/api/v1/candidates?${qs}`, { auth: true }),
  },
};
