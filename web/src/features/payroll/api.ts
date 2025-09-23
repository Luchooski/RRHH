// web/src/features/payroll/api.ts
import { z } from 'zod';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

/** ===== Schemas compatibles con el backend ===== */
export const PeriodRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
export const ConceptType = z.enum(['remunerativo','no_remunerativo','deduccion']);
export const ConceptMode = z.enum(['monto','porcentaje']);
export const CalcBase = z.enum(['imponible','bruto','neto_previo','personalizado']);
export const Phase = z.enum(['pre_tax','post_tax']);
export const RoundMode = z.enum(['none','nearest','down','up']);

import { http, apiUrl } from '../../lib/http';

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

/** ===== Http helper ===== */
async function request<T>(path: string, init?: RequestInit, schema?: z.Schema<T>): Promise<T> {
  const url = `${BASE}${path}`;

  // ✅ Solo seteamos Content-Type si hay body
  const headers: Record<string, string> = {};
  if (init?.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  // Merge con headers entrantes (si los hubiera)
  const mergedInit: RequestInit = {
    ...init,
    headers: { ...(init?.headers as any), ...headers }
  };

  const res = await fetch(url, mergedInit);
  if (!res.ok) {
    let txt = '';
    try { txt = await res.text(); } catch {}
    throw new Error(txt || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as unknown as T;

  const json = await res.json().catch(() => ({}));
  const data = (json?.data ?? json) as unknown;
  return schema ? schema.parse(data) : (data as T);
}

/** ===== API ===== */
export async function apiHealth(): Promise<boolean> {
  try { await http('/api/v1/health'); return true; } catch { return false; }
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
  return http<ListOutDTO>(`/api/v1/payrolls${q}`);
}

export async function createPayroll(body: PayrollInputDTO) {
  return http<PayrollDTO>('/api/v1/payrolls', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export async function approvePayroll(id: string) {
  const safeId = encodeURIComponent(id);
  return http<{ id: string; status: 'Borrador'|'Aprobado' }>(
    `/api/v1/payrolls/${safeId}/approve`,
    { method: 'PATCH' }
  );
}

export async function deletePayroll(id: string) {
  await http<void>(`/api/v1/payrolls/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
export async function getPayroll(id: string) {
  return http<PayrollDTO>(`/api/v1/payrolls/${encodeURIComponent(id)}`);
}
export async function updatePayroll(id: string, body: Partial<PayrollInputDTO>) {
  return http<PayrollDTO>(`/api/v1/payrolls/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
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
  return http<{ created: number }>('/api/v1/payrolls/bulk', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}
export function exportCsvUrl(params: { period?: string; status?: 'Borrador'|'Aprobado' }) {
  const qs = new URLSearchParams();
  if (params.period) qs.set('period', params.period);
  if (params.status) qs.set('status', params.status);
  return apiUrl(`/api/v1/payrolls/export.csv?${qs.toString()}`);
}