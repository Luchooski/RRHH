import { http } from '@/lib/http';
import type {
  Attendance,
  CheckInInput,
  CheckOutInput,
  BreakInput,
  MarkAbsenceInput,
  UpdateAttendanceInput,
  AttendanceSummary,
  AttendanceListOut,
} from './dto';

export async function apiCheckIn(input: CheckInInput) {
  return http.post<Attendance>('/api/v1/attendance/check-in', input, { auth: true });
}

export async function apiCheckOut(input: CheckOutInput) {
  return http.post<Attendance>('/api/v1/attendance/check-out', input, { auth: true });
}

export async function apiRegisterBreak(input: BreakInput) {
  return http.post<Attendance>('/api/v1/attendance/break', input, { auth: true });
}

export async function apiGetTodayAttendance() {
  return http.get<Attendance>('/api/v1/attendance/today', { auth: true });
}

export async function apiListAttendances(params?: {
  employeeId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  skip?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.employeeId) qs.set('employeeId', params.employeeId);
  if (params?.status) qs.set('status', params.status);
  if (params?.startDate) qs.set('startDate', params.startDate);
  if (params?.endDate) qs.set('endDate', params.endDate);
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.skip) qs.set('skip', String(params.skip));

  const q = qs.toString() ? `?${qs.toString()}` : '';
  const raw = await http.get<any>(`/api/v1/attendance${q}`, { auth: true });

  if (Array.isArray(raw)) {
    return { items: raw, total: raw.length } as AttendanceListOut;
  }
  return (raw ?? { items: [], total: 0 }) as AttendanceListOut;
}

export async function apiGetAttendanceSummary(params: {
  employeeId: string;
  startDate: string;
  endDate: string;
}) {
  const qs = new URLSearchParams();
  qs.set('employeeId', params.employeeId);
  qs.set('startDate', params.startDate);
  qs.set('endDate', params.endDate);

  return http.get<AttendanceSummary>(`/api/v1/attendance/summary?${qs.toString()}`, { auth: true });
}

export async function apiMarkAbsence(input: MarkAbsenceInput) {
  return http.post<Attendance>('/api/v1/attendance/mark-absence', input, { auth: true });
}

export async function apiUpdateAttendance(id: string, input: UpdateAttendanceInput) {
  return http.patch<Attendance>(`/api/v1/attendance/${encodeURIComponent(id)}`, input, { auth: true });
}

export async function apiDeleteAttendance(id: string) {
  return http.delete<{ ok: boolean }>(`/api/v1/attendance/${encodeURIComponent(id)}`, { auth: true });
}
