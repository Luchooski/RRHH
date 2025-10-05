import { http } from '@/lib/http';
import type { Employee, EmployeeCreateInput, EmployeeListOut } from './dto';

export async function apiListEmployees(params?: { limit?: number; skip?: number }) {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.skip) qs.set('skip', String(params.skip));
  const q = qs.toString() ? `?${qs.toString()}` : '';
  // Respuesta esperada: { items: Employee[], total: number } o array simple
  const raw = await http.get<any>(`/api/v1/employees${q}`, { auth: true });
  if (Array.isArray(raw)) {
    return { items: raw, total: raw.length } as EmployeeListOut;
  }
  return (raw ?? { items: [], total: 0 }) as EmployeeListOut;
}

export async function apiCreateEmployee(input: EmployeeCreateInput) {
  return http.post<Employee>('/api/v1/employees', input, { auth: true });
}

export async function apiDeleteEmployee(id: string) {
  return http.delete<{ ok: boolean }>(`/api/v1/employees/${encodeURIComponent(id)}`, { auth: true });
}
