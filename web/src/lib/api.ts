// web/src/lib/api.ts
import { http as httpClient, setToken } from './http';

// Re-export http for use in feature modules
export { httpClient as http, setToken };

export type LoginBody = { email: string; password: string };

export type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
};

export type LoginRes = {
  accessToken: string;
  refreshToken: string;
  user: User;
  // Legacy support
  token?: string;
};

export type RefreshRes = {
  accessToken: string;
  refreshToken: string;
};

export const api = {
  // Auth
  login: (body: LoginBody) => httpClient.post<LoginRes>('/api/v1/auth/login', body),

  refresh: () => httpClient.post<RefreshRes>('/api/v1/auth/refresh', undefined, { auth: true }),

  me: () => httpClient.get<User>('/api/v1/auth/me', { auth: true }),

  logout: async () => {
    try {
      await httpClient.post<{ ok: boolean }>('/api/v1/auth/logout', undefined, { auth: true });
    } catch {
      // Ignorar; igual limpiamos el token abajo
    } finally {
      setToken(null);
    }
  },

  // Ejemplos de otros recursos (ajusta según tus rutas reales)
  employees: {
    list: () => httpClient.get<any[]>('/api/v1/employees', { auth: true }),
  },
  candidates: {
    list: (qs = 'limit=20&skip=0') => httpClient.get<any[]>(`/api/v1/candidates?${qs}`, { auth: true }),
  },
};
