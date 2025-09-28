import { http, apiUrl } from '../../lib/http';
import { z } from 'zod';

/** ===== Schemas compatibles con el backend ===== */
export const PeriodRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
export const ConceptType = z.enum(['remunerativo','no_remunerativo','deduccion']);
export const ConceptMode = z.enum(['monto','porcentaje']);
export const CalcBase = z.enum(['imponible','bruto','neto_previo','personalizado']);
export const Phase = z.enum(['pre_tax','post_tax']);
export const RoundMode = z.enum(['none','nearest','down','up']);

export const ConceptDTO = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: ConceptType,
  mode: ConceptMode,
  value: z.number().min(0),
  base: CalcBase.optional(),
  phase: Phase.optional(),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
  roundMode: RoundMode.optional(),
  roundDecimals: z.number().int().min(0).max(4).optional(),
  priority: z.number().int().min(0).optional(),
  enabled: z.boolean().optional(),
  customBase: z.number().min(0).optional()
});
export type ConceptDTO = z.infer<typeof ConceptDTO>;

export const PayrollInputDTO = z.object({
  employeeId: z.string().min(1),
  employeeName: z.string().min(1),
  period: z.string().regex(PeriodRegex),
  baseSalary: z.number().min(0),
  bonuses: z.number().min(0).default(0),
  overtimeHours: z.number().min(0).default(0),
  overtimeRate: z.number().min(0).default(0),
  deductions: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100).default(0),
  contributionsRate: z.number().min(0).max(100).default(0),
  concepts: z.array(ConceptDTO).default([])
});
export type PayrollInputDTO = z.infer<typeof PayrollInputDTO>;

export const PayrollStatus = z.enum(['Borrador','Aprobado']);
export const PayrollDTO = PayrollInputDTO.extend({
  id: z.string(),
  status: PayrollStatus,
  createdAt: z.string(),
  updatedAt: z.string()
});
export type PayrollDTO = z.infer<typeof PayrollDTO>;

export const ListOutDTO = z.object({
  items: z.array(PayrollDTO),
  total: z.number().int().min(0)
});
export type ListOut = z.infer<typeof ListOutDTO>;

/** ===== API ===== */
export async function apiHealth(): Promise<boolean> {
  try { await http.get('/api/v1/health'); return true; } catch { return false; }
}

export async function listPayrolls(params: {
  period?: string; status?: 'Borrador'|'Aprobado'; limit?: number; skip?: number
} = {}) {
  const qs = new URLSearchParams();
  if (params.period) qs.set('period', params.period);
  if (params.status) qs.set('status', params.status);
  if (params.limit)  qs.set('limit', String(params.limit));
  if (params.skip)   qs.set('skip', String(params.skip));
  const q = qs.toString() ? `?${qs.toString()}` : '';
  const raw = await http.get<any>(`/api/v1/payrolls${q}`, { auth: true });
  const data = (raw?.data ?? raw) as { items?: any[]; total?: number };
  const items = Array.isArray(data.items) ? data.items : [];
  const total = typeof data.total === 'number' ? data.total : items.length;
  const norm = items.map((it) => ({
    id: it.id ?? it._id ?? '',
    ...it,
  }));
  console.debug('[payrolls] received', { total, count: norm.length, first: norm[0] });
  return { items: norm, total } as ListOut;
}

export async function createPayroll(body: PayrollInputDTO) {
  return http.post<PayrollDTO>('/api/v1/payrolls', body, { auth: true });
}

export async function approvePayroll(id: string) {
  const safeId = encodeURIComponent(id);
  return http.patch<PayrollDTO>(`/api/v1/payrolls/${safeId}/approve`, {}, { auth: true });
}

export async function deletePayroll(id: string) {
  return http.delete<{ success: boolean }>(`/api/v1/payrolls/${id}`, { auth: true });
}
export async function getPayroll(id: string) {
  return http.get<PayrollDTO>(`/api/v1/payrolls/${id}`, { auth: true });
}
export async function updatePayroll(id: string, patch: Partial<PayrollInputDTO>) {
  return http.patch<PayrollDTO>(`/api/v1/payrolls/${id}`, patch, { auth: true });
}
export async function bulkCreate(body: {
  period: string;
  defaults: {
    bonuses: number; overtimeHours: number; overtimeRate: number;
    deductions: number; taxRate: number; contributionsRate: number;
  };
  concepts: ConceptDTO[];
  employees: { employeeId: string; employeeName: string; baseSalary: number; }[];
}) {
   return http.post<{ created: number }>('/api/v1/payrolls/bulk', body, { auth: true });
}
export function exportCsvUrl(params: { period?: string; status?: 'Borrador'|'Aprobado' }) {
  const qs = new URLSearchParams();
  if (params.period) qs.set('period', params.period);
  if (params.status) qs.set('status', params.status);
  return apiUrl(`/api/v1/payrolls/export.csv?${qs.toString()}`);
}
// 👉 Descarga CSV usando Authorization (para endpoints protegidos)
export async function downloadCsv(params: { period?: string; status?: 'Borrador'|'Aprobado' }) {
  const qs = new URLSearchParams();
  if (params.period) qs.set('period', params.period);
  if (params.status) qs.set('status', params.status);
  const path = `/api/v1/payrolls/export.csv?${qs.toString()}`;
   const blob = await http.blob(path, { auth: true });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `payrolls${params.period ? '_' + params.period : ''}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}