import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  listPayrolls, getById, createPayroll, updateById, removePayroll, approvePayroll, updateStatus, streamReceiptPdf,
} from './payroll.service.js';

// ---------- Zod ----------
const Err = z.object({ error: z.object({ code: z.string(), message: z.string() }) });

const StatusCompatValues = ['pendiente','aprobada','pagada','anulada','Borrador','Aprobado'] as const;
const StatusCompat = z.enum(StatusCompatValues);
type StatusCompatT = z.infer<typeof StatusCompat>;

const Concept = z.object({
  code: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['remunerativo','no_remunerativo','indemnizacion']),
  amount: z.number().nonnegative(),
  taxable: z.boolean().default(true),
});
const Deduction = z.object({
  code: z.string().min(1),
  label: z.string().min(1),
  amount: z.number().nonnegative(),
});

const Payroll = z.object({
  id: z.string(),
  employeeId: z.string(),
  employeeName: z.string(),
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/,'YYYY-MM'),
  type: z.enum(['mensual','final','extraordinaria','vacaciones']).default('mensual'),
  status: StatusCompat.default('pendiente'),
  baseSalary: z.number().nonnegative(),
  concepts: z.array(Concept).default([]),
  deductions: z.array(Deduction).default([]),
  grossTotal: z.number().nonnegative(),
  deductionsTotal: z.number().nonnegative(),
  netTotal: z.number().nonnegative(),
  currency: z.string().default('ARS'),
  paymentMethod: z.enum(['transferencia','efectivo','cheque','otro']).optional(),
  bankAccount: z.string().optional(),
  paymentDate: z.string().optional(),
  receiptUrl: z.string().url().optional(),
  notes: z.string().optional(),
  approvedBy: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
type PayrollOut = z.infer<typeof Payroll>;

const QueryList = z.object({
  period: z.string().optional(),
  employee: z.string().optional(),
  status: StatusCompat.optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  skip: z.coerce.number().int().min(0).optional(),
});
type QueryListT = z.infer<typeof QueryList>;

const PayrollCreate = Payroll.omit({
  id:true, createdAt:true, updatedAt:true,
  grossTotal:true, deductionsTotal:true, netTotal:true,
}).extend({
  grossTotal: z.number().nonnegative().optional(),
  deductionsTotal: z.number().nonnegative().optional(),
  netTotal: z.number().nonnegative().optional(),
});

const PayrollUpdate = PayrollCreate.partial();

const ListOut = z.object({
  items: z.array(Payroll),
  total: z.number().int().nonnegative(),
  limit: z.number().int().nonnegative(),
  skip: z.number().int().nonnegative(),
});
type ListOutT = z.infer<typeof ListOut>;

// ---------- helpers ----------
const mapStatusOut = (s: any): z.infer<typeof StatusCompat> =>
  s === 'Borrador' ? 'pendiente' : s === 'Aprobado' ? 'aprobada' :
  (StatusCompatValues.includes(s) ? s : 'pendiente') as z.infer<typeof StatusCompat>;

function mapOut(i: any): PayrollOut {
  return {
    id: String(i.id ?? i._id),
    employeeId: String(i.employeeId),
    employeeName: String(i.employeeName),
    period: String(i.period),
    type: (i.type ?? 'mensual') as PayrollOut['type'],
    status: mapStatusOut(i.status),
    baseSalary: Number(i.baseSalary ?? 0),
    concepts: Array.isArray(i.concepts) ? i.concepts.map((c: any) => ({
      code: String(c.code), label: String(c.label), type: c.type, amount: Number(c.amount ?? 0), taxable: Boolean(c.taxable ?? true),
    })) : [],
    deductions: Array.isArray(i.deductions) ? i.deductions.map((d: any) => ({
      code: String(d.code), label: String(d.label), amount: Number(d.amount ?? 0),
    })) : [],
    grossTotal: Number(i.grossTotal ?? 0),
    deductionsTotal: Number(i.deductionsTotal ?? i.deductions ?? 0),
    netTotal: Number(i.netTotal ?? (Number(i.grossTotal ?? 0) - Number(i.deductionsTotal ?? i.deductions ?? 0))),
    currency: String(i.currency ?? 'ARS'),
    paymentMethod: i.paymentMethod,
    bankAccount: i.bankAccount,
    paymentDate: typeof i.paymentDate === 'string' ? i.paymentDate : (i.paymentDate ? new Date(i.paymentDate).toISOString() : undefined),
    receiptUrl: i.receiptUrl,
    notes: i.notes,
    approvedBy: i.approvedBy,
    createdAt: typeof i.createdAt === 'string' ? i.createdAt : new Date(i.createdAt).toISOString(),
    updatedAt: typeof i.updatedAt === 'string' ? i.updatedAt : new Date(i.updatedAt).toISOString(),
  };
}

// ---------- plugin ----------
const payrollRoutes: FastifyPluginAsync = async (app) => {
  const r = app.withTypeProvider<ZodTypeProvider>();

  // LIST
  r.route({
    method: 'GET',
    url: '/payrolls',
    schema: { querystring: QueryList, response: { 200: ListOut } },
    handler: async (req, reply) => {
      const { period, employee, status, limit, skip } = req.query as QueryListT;
      const res = await listPayrolls({ period, employee, status, limit, skip });

      (app.log?.info ?? console.warn).call(app.log, { msg:'GET /payrolls', query:{ period, employee, status, limit, skip }, total: res.total });

      const payload: ListOutT = { items: res.items.map(mapOut), total: res.total, limit: res.limit, skip: res.skip };
      return reply.send(payload);
    },
  });

  // DETAIL
  r.route({
    method: 'GET',
    url: '/payrolls/:id',
    schema: { response: { 200: Payroll, 404: Err } },
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      const found = await getById(id);
      if (!found) return reply.code(404).send({ error: { code:'NOT_FOUND', message:'Payroll not found' }});
      return reply.send(mapOut(found));
    },
  });

  // CREATE
  r.route({
    method: 'POST',
    url: '/payrolls',
    schema: { body: PayrollCreate, response: { 201: Payroll, 400: Err } },
    handler: async (req, reply) => {
      const created = await createPayroll(req.body);
      return reply.code(201).send(mapOut(created));
    },
  });

  // UPDATE
  r.route({
    method: 'PUT',
    url: '/payrolls/:id',
    schema: { body: PayrollUpdate, response: { 200: Payroll, 404: Err } },
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      const updated = await updateById(id, req.body);
      if (!updated) return reply.code(404).send({ error: { code:'NOT_FOUND', message:'Payroll not found' }});
      return reply.send(mapOut(updated));
    },
  });

  // APPROVE (compat)
  r.route({
    method: 'PATCH',
    url: '/payrolls/:id/approve',
    schema: { response: { 200: Payroll, 404: Err } },
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      const updated = await approvePayroll(id);
      if (!updated) return reply.code(404).send({ error: { code:'NOT_FOUND', message:'Payroll not found' }});
      return reply.send(mapOut(updated));
    },
  });

  // SET STATUS
  r.route({
    method: 'PATCH',
    url: '/payrolls/:id/status',
    schema: { body: z.object({ status: StatusCompat }), response: { 200: Payroll, 404: Err } },
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      const { status } = req.body as { status: StatusCompatT };
      const updated = await updateStatus(id, status);
      if (!updated) return reply.code(404).send({ error: { code:'NOT_FOUND', message:'Payroll not found' }});
      return reply.send(mapOut(updated));
    },
  });

  // PDF
  r.route({
    method: 'GET',
    url: '/payrolls/:id/receipt.pdf',
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      const ok = await streamReceiptPdf(id, reply);
      if (!ok) return reply.code(404).send({ error: { code:'NOT_FOUND', message:'Payroll not found' }});
      return reply; // stream
    },
  });

  // DELETE
  r.route({
    method: 'DELETE',
    url: '/payrolls/:id',
    schema: { response: { 200: z.object({ ok: z.boolean() }), 404: Err } },
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      await removePayroll(id);
      return reply.send({ ok: true });
    },
  });
};

export { payrollRoutes };
export default payrollRoutes;
