import { http, apiUrl } from '@/lib/http';
import type { Payroll, PayrollListOut } from './dto';

// Util: "YYYY-MM" actual
export function currentPeriod() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function normalizeOne(it: any): Payroll {
  return {
    id: it.id ?? it._id ?? '',
    employeeId: it.employeeId,
    employeeName: it.employeeName,
    period: it.period,
    baseSalary: Number(it.baseSalary ?? 0),
    bonuses: Number(it.bonuses ?? 0),
    overtimeHours: Number(it.overtimeHours ?? 0),
    overtimeRate: Number(it.overtimeRate ?? 0),
    deductions: Number(it.deductions ?? 0),
    taxRate: Number(it.taxRate ?? 0),
    contributionsRate: Number(it.contributionsRate ?? 0),
    status: (it.status as Payroll['status']) ?? 'Borrador',
    createdAt: typeof it.createdAt === 'string' ? it.createdAt : new Date(it.createdAt).toISOString(),
    updatedAt: typeof it.updatedAt === 'string' ? it.updatedAt : new Date(it.updatedAt).toISOString(),
  };
}

/** GET /api/v1/payrolls */
export async function apiListPayrolls(params?: {
  period?: string;
  status?: 'Borrador' | 'Aprobado';
  limit?: number;
  skip?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.period) qs.set('period', params.period);
  if (params?.status) qs.set('status', params.status);
  if (params?.limit)  qs.set('limit', String(params.limit));
  if (params?.skip)   qs.set('skip', String(params.skip));
  const q = qs.toString() ? `?${qs.toString()}` : '';

  const raw = await http.get<any>(`/api/v1/payrolls${q}`, { auth: true });
  if (Array.isArray(raw)) {
    const items = raw.map(normalizeOne);
    return { items, total: items.length } as PayrollListOut;
  }
  const items = Array.isArray(raw?.items) ? raw.items.map(normalizeOne) : [];
  const total = typeof raw?.total === 'number' ? raw.total : items.length;
  return { items, total } as PayrollListOut;
}

/** PATCH /api/v1/payrolls/:id/approve */
export function apiApprovePayroll(id: string) {
  return http.patch(`/api/v1/payrolls/${encodeURIComponent(id)}/approve`, {}, { auth: true });
}

/** DELETE /api/v1/payrolls/:id */
export function apiDeletePayroll(id: string) {
  return http.delete(`/api/v1/payrolls/${encodeURIComponent(id)}`, { auth: true });
}

/** GET /api/v1/payrolls/export.csv */
export function exportCsvUrl(params?: { period?: string; status?: 'Borrador' | 'Aprobado' }) {
  const qs = new URLSearchParams();
  if (params?.period) qs.set('period', params.period);
  if (params?.status) qs.set('status', params.status);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return apiUrl(`/api/v1/payrolls/export.csv${query}`);
}

export async function downloadCsv(params?: { period?: string; status?: 'Borrador' | 'Aprobado' }) {
  const url = exportCsvUrl(params);
  // Usa auth: true para agregar Authorization si tu endpoint lo requiere
  const blob = await http.blob(url, { auth: true });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `payrolls${params?.period ? '_' + params.period : ''}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
