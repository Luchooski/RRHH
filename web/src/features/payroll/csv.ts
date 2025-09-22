import type { PayrollRecord } from './schema';

function esc(v: string | number) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV genérico desde objetos planos */
export function toCSVRecords(rows: Array<Record<string, string | number>>): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => esc((r as any)[h] ?? '')).join(',')),
  ];
  return lines.join('\n');
}

/** CSV tipado de liquidaciones completas */
export function toCSV(rows: PayrollRecord[]): string {
  const flat = rows.map((r) => ({
    id: r.id,
    employeeId: r.employeeId,
    employeeName: r.employeeName,
    period: r.period,
    baseSalary: r.baseSalary,
    bonuses: r.bonuses,
    overtimeHours: r.overtimeHours,
    overtimeRate: r.overtimeRate,
    deductions: r.deductions,
    taxRate: r.taxRate,
    contributionsRate: r.contributionsRate,
    status: r.status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
  return toCSVRecords(flat);
}

export function download(filename: string, content: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
