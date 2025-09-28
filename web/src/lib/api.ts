// web/src/lib/api.ts
import { http } from './http';

type User = { id: string; email: string; role: string };

export const AuthApi={
  login:(email:string,password:string)=>http.post<{token:string;user:User}>('/api/v1/auth/login',{email,password},{auth:false}),
  me:()=>http.get<User>('/api/v1/auth/me'),
  logout:()=>http.post<{ok:boolean}>('/api/v1/auth/logout',undefined)
};

export const HealthApi = {
  ping: () => http.get<{ status: 'ok' }>('/api/v1/health'),
};

// Para construir URLs absolutas (descargas, imágenes, etc.)
export function buildApiUrl(path: string) {
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : '/' + path;
  return base + p;
}