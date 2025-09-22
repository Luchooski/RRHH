import { z } from 'zod';
import {
  PayrollRecordSchema, PayrollInputSchema,
  type PayrollInput, type PayrollRecord, ConceptSchema, type Concept,
  TemplateSchema, type Template
} from './schema';

const KEY = 'mh-payrolls';
const TPLS = 'mh-payroll-templates';

const Records = z.array(PayrollRecordSchema);
const TemplatesZ = z.array(TemplateSchema);

function readAll(): PayrollRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const json = JSON.parse(raw);
    const parsed = Records.safeParse(json);
    return parsed.success ? parsed.data : [];
  } catch { return []; }
}
function writeAll(list: PayrollRecord[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

function uid(prefix: string) { return prefix + '_' + Math.random().toString(36).slice(2, 9); }
function isoNow() { return new Date().toISOString(); }

/* ===== Liquidaciones ===== */
export function list(opts?: { q?: string; order?: 'desc' | 'asc' }): PayrollRecord[] {
  const q = (opts?.q ?? '').trim().toLowerCase();
  const order = opts?.order ?? 'desc';
  let data = readAll();
  if (q) {
    data = data.filter(r =>
      [r.employeeName, r.period, r.id, r.status].join(' ').toLowerCase().includes(q)
    );
  }
  data.sort((a, b) => (order === 'desc'
    ? b.createdAt.localeCompare(a.createdAt)
    : a.createdAt.localeCompare(b.createdAt)));
  return data;
}

export function create(input: PayrollInput, concepts: Concept[] = [], status: 'Borrador'|'Aprobado'='Borrador'): PayrollRecord {
  const body = PayrollInputSchema.parse(input);
  const rec: PayrollRecord = {
    ...body,
    id: uid('pay'),
    createdAt: isoNow(),
    updatedAt: isoNow(),
    status,
    concepts
  };
  const list_ = readAll();
  list_.unshift(rec);
  writeAll(list_);
  return rec;
}
export function update(id: string, patch: Partial<PayrollInput> & { status?: 'Borrador'|'Aprobado', concepts?: Concept[] }): PayrollRecord {
  const list_ = readAll();
  const idx = list_.findIndex(r => r.id === id);
  if (idx === -1) throw new Error('Not found');
  const current = list_[idx];
  const next = { ...current, ...patch, updatedAt: isoNow() };
  const ok = PayrollRecordSchema.safeParse(next);
  if (!ok.success) throw new Error('Invalid record');
  list_[idx] = ok.data;
  writeAll(list_);
  return ok.data;
}
export function approve(id: string): PayrollRecord { return update(id, { status: 'Aprobado' }); }
export function remove(id: string): void {
  const list_ = readAll().filter(r => r.id !== id);
  writeAll(list_);
}
export function bulkCreate(employees: { id: string; name: string; baseSalary: number }[], period: string, base: Omit<PayrollInput, 'employeeId'|'employeeName'|'period'>, concepts: Concept[]): number {
  const created: PayrollRecord[] = [];
  for (const e of employees) {
    created.push(create({
      employeeId: e.id,
      employeeName: e.name,
      period,
      baseSalary: e.baseSalary,
      bonuses: base.bonuses,
      overtimeHours: base.overtimeHours,
      overtimeRate: base.overtimeRate,
      deductions: base.deductions,
      taxRate: base.taxRate,
      contributionsRate: base.contributionsRate
    }, concepts, 'Borrador'));
  }
  return created.length;
}
/* export/import liquidaciones */
export function exportJSON(): string { return JSON.stringify(readAll(), null, 2); }
export function importJSON(json: string): number {
  const parsed = Records.parse(JSON.parse(json));
  writeAll(parsed);
  return parsed.length;
}

/* ===== Plantillas ===== */
function readTpls(): Template[] {
  try {
    const raw = localStorage.getItem(TPLS);
    if (!raw) return [];
    const json = JSON.parse(raw);
    const parsed = TemplatesZ.safeParse(json);
    return parsed.success ? parsed.data : [];
  } catch { return []; }
}
function writeTpls(list: Template[]) {
  localStorage.setItem(TPLS, JSON.stringify(list));
}

export function listTemplates(): Template[] { return readTpls(); }
export function saveTemplateNamed(name: string, concepts: Concept[]): Template {
  const tpl: Template = { id: uid('tpl'), name, concepts };
  const list = readTpls();
  list.push(tpl);
  writeTpls(list);
  return tpl;
}
export function updateTemplate(id: string, patch: Partial<Pick<Template, 'name'|'concepts'>>): Template {
  const list = readTpls();
  const idx = list.findIndex(t => t.id === id);
  if (idx === -1) throw new Error('Tpl not found');
  const next = { ...list[idx], ...patch };
  const ok = TemplateSchema.safeParse(next);
  if (!ok.success) throw new Error('Invalid template');
  list[idx] = ok.data;
  writeTpls(list);
  return ok.data;
}
export function removeTemplate(id: string): void {
  writeTpls(readTpls().filter(t => t.id !== id));
}
