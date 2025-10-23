import { http } from '@/lib/http';
import type { Leave, LeaveCreateInput, LeaveUpdateInput, LeaveApproveInput, LeaveBalance, LeaveListOut } from './dto';

export async function apiListLeaves(params?: {
  employeeId?: string;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  year?: number;
  month?: number;
  limit?: number;
  skip?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.employeeId) qs.set('employeeId', params.employeeId);
  if (params?.type) qs.set('type', params.type);
  if (params?.status) qs.set('status', params.status);
  if (params?.startDate) qs.set('startDate', params.startDate);
  if (params?.endDate) qs.set('endDate', params.endDate);
  if (params?.year) qs.set('year', String(params.year));
  if (params?.month) qs.set('month', String(params.month));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.skip) qs.set('skip', String(params.skip));

  const q = qs.toString() ? `?${qs.toString()}` : '';
  const raw = await http.get<any>(`/api/v1/leaves${q}`, { auth: true });

  if (Array.isArray(raw)) {
    return { items: raw, total: raw.length } as LeaveListOut;
  }
  return (raw ?? { items: [], total: 0 }) as LeaveListOut;
}

export async function apiGetLeave(id: string) {
  return http.get<Leave>(`/api/v1/leaves/${encodeURIComponent(id)}`, { auth: true });
}

export async function apiCreateLeave(input: LeaveCreateInput) {
  return http.post<Leave>('/api/v1/leaves', input, { auth: true });
}

export async function apiUpdateLeave(id: string, input: LeaveUpdateInput) {
  return http.patch<Leave>(`/api/v1/leaves/${encodeURIComponent(id)}`, input, { auth: true });
}

export async function apiApproveLeave(id: string, input: LeaveApproveInput) {
  return http.post<Leave>(`/api/v1/leaves/${encodeURIComponent(id)}/approve`, input, { auth: true });
}

export async function apiCancelLeave(id: string) {
  return http.post<Leave>(`/api/v1/leaves/${encodeURIComponent(id)}/cancel`, undefined, { auth: true });
}

export async function apiDeleteLeave(id: string) {
  return http.delete<{ ok: boolean }>(`/api/v1/leaves/${encodeURIComponent(id)}`, { auth: true });
}

export async function apiGetLeaveBalance(employeeId: string, year?: number) {
  const qs = year ? `?year=${year}` : '';
  return http.get<LeaveBalance>(`/api/v1/leaves/balance/${encodeURIComponent(employeeId)}${qs}`, { auth: true });
}
