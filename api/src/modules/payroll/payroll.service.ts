import { Payroll } from './payroll.model.js';
import type { PayrollDoc } from './payroll.model.js';

// ⬇️ Exportamos todo lo que usan controller/routes

export async function createPayroll(
  data: Omit<PayrollDoc, '_id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: 'Borrador' | 'Aprobado' }
) {
  const doc = await Payroll.create(data);
  return doc;
}

export async function listPayrolls(filters: {
  period?: string;
  employee?: string;
  status?: 'Borrador' | 'Aprobado';
  limit?: number;
  skip?: number;
}) {
  const q: any = {};
  if (filters.period) q.period = filters.period;
  if (filters.employee) q.employeeId = filters.employee;
  if (filters.status) q.status = filters.status;

  const items = await Payroll.find(q)
    .sort({ createdAt: -1 })
    .skip(filters.skip ?? 0)
    .limit(filters.limit ?? 20)
    .lean();
  const total = await Payroll.countDocuments(q);
  return { items, total };
}

export async function approvePayroll(id: string) {
  return Payroll.findByIdAndUpdate(
    id,
    { status: 'Aprobado', updatedAt: new Date() },
    { new: true, runValidators: true }
  ).lean();
}

export async function removePayroll(id: string) {
  await Payroll.findByIdAndDelete(id);
}

/** === Extensiones para completar la sección === */

export async function getById(id: string) {
  return Payroll.findById(id).lean();
}

export async function updateById(id: string, patch: Partial<PayrollDoc>) {
  return Payroll.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true }).lean();
}

export async function bulkCreate(data: {
  period: string;
  defaults: {
    bonuses: number;
    overtimeHours: number;
    overtimeRate: number;
    deductions: number;
    taxRate: number;
    contributionsRate: number;
  };
  concepts: any[];
  employees: { employeeId: string; employeeName: string; baseSalary: number }[];
}) {
  const now = new Date();
  const docs = data.employees.map((e) => ({
    employeeId: e.employeeId,
    employeeName: e.employeeName,
    period: data.period,
    baseSalary: e.baseSalary,
    bonuses: data.defaults.bonuses,
    overtimeHours: data.defaults.overtimeHours,
    overtimeRate: data.defaults.overtimeRate,
    deductions: data.defaults.deductions,
    taxRate: data.defaults.taxRate,
    contributionsRate: data.defaults.contributionsRate,
    status: 'Borrador',
    concepts: data.concepts,
    createdAt: now,
    updatedAt: now
  }));
  const res = await Payroll.insertMany(docs);
  return res.length;
}

export async function exportCSV(filters: { period?: string; employee?: string; status?: 'Borrador' | 'Aprobado' }) {
  const q: any = {};
  if (filters.period) q.period = filters.period;
  if (filters.employee) q.employeeId = filters.employee;
  if (filters.status) q.status = filters.status;

  const items = await Payroll.find(q).sort({ createdAt: -1 }).lean();
  const headers = [
    'id',
    'employeeId',
    'employeeName',
    'period',
    'baseSalary',
    'bonuses',
    'overtimeHours',
    'overtimeRate',
    'deductions',
    'taxRate',
    'contributionsRate',
    'status',
    'createdAt'
  ];
  const esc = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
  const rows = items.map((i) =>
    [
      i._id,
      i.employeeId,
      i.employeeName,
      i.period,
      i.baseSalary,
      i.bonuses,
      i.overtimeHours,
      i.overtimeRate,
      i.deductions,
      i.taxRate,
      i.contributionsRate,
      i.status,
      i.createdAt?.toISOString?.()
    ]
      .map(esc)
      .join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}
