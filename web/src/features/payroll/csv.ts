import type { PayrollRecord } from './schema';

function esc(s: string) {
  return `"${s.replace(/"/g, '""')}"`;
}

export function toCSV(rows: PayrollRecord[]): string {
  const head = ['id','employeeName','period','baseSalary','bonuses','overtimeHours','overtimeRate','deductions','taxRate','contributionsRate','createdAt','updatedAt'];
  const lines = [head.join(',')];
  for (const r of rows) {
    lines.push([
      r.id,
      r.employeeName,
      r.period,
      r.baseSalary,
      r.bonuses,
      r.overtimeHours,
      r.overtimeRate,
      r.deductions,
      r.taxRate,
      r.contributionsRate,
      r.createdAt,
      r.updatedAt
    ].map(x => esc(String(x))).join(','));
  }
  return lines.join('\n');
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
