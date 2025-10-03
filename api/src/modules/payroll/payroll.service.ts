import { Payroll } from './payroll.model.js';

export type PayrollCreateInput = {
  employeeId: string;
  employeeName: string;
  period: string; // 'YYYY-MM'
  baseSalary: number;
  bonuses?: number;
  overtimeHours?: number;
  overtimeRate?: number;
  deductions?: number;
  taxRate?: number;
  contributionsRate?: number;
  status?: 'Borrador' | 'Aprobado';
  concepts?: any[];
};

export type PayrollUpdateInput = Partial<PayrollCreateInput>;

export async function createPayroll(data: PayrollCreateInput) {
  const doc = await Payroll.create(data);
  return doc.toObject({ virtuals: true }); // objeto plano + id virtual
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

  const limit = Number.isFinite(filters.limit) ? Number(filters.limit) : 20;
  const skip = Number.isFinite(filters.skip) ? Number(filters.skip) : 0;

  const items = await Payroll.find(q)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean({ virtuals: true }); // <- id virtual, arrays planos

  const total = await Payroll.countDocuments(q);
  return { items, total, limit, skip };
}

export async function approvePayroll(id: string) {
  return Payroll.findByIdAndUpdate(
    id,
    { status: 'Aprobado', updatedAt: new Date() },
    { new: true, runValidators: true }
  ).lean({ virtuals: true });
}

export async function removePayroll(id: string) {
  await Payroll.findByIdAndDelete(id);
  return { ok: true };
}

export async function getById(id: string) {
  return Payroll.findById(id).lean({ virtuals: true });
}

export async function updateById(id: string, patch: PayrollUpdateInput) {
  return Payroll.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true })
    .lean({ virtuals: true });
}

export async function bulkCreate(data: {
  period: string;
  defaults: {
    bonuses: number; overtimeHours: number; overtimeRate: number;
    deductions: number; taxRate: number; contributionsRate: number;
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
    updatedAt: now,
  }));
  const res = await Payroll.insertMany(docs);
  return res.length;
}

export async function exportCSV(filters: { period?: string; employee?: string; status?: 'Borrador' | 'Aprobado' }) {
  const q: any = {};
  if (filters.period) q.period = filters.period;
  if (filters.employee) q.employeeId = filters.employee;
  if (filters.status) q.status = filters.status;

  const items = await Payroll.find(q).sort({ createdAt: -1 }).lean({ virtuals: true });
  const headers = [
    'id','employeeId','employeeName','period','baseSalary','bonuses','overtimeHours',
    'overtimeRate','deductions','taxRate','contributionsRate','status','createdAt'
  ];
  const esc = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = items.map((i: any) =>
    [
      i.id, i.employeeId, i.employeeName, i.period, i.baseSalary, i.bonuses,
      i.overtimeHours, i.overtimeRate, i.deductions, i.taxRate,
      i.contributionsRate, i.status,
      typeof i.createdAt === 'string' ? i.createdAt : i.createdAt?.toISOString?.(),
    ].map(esc).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}
