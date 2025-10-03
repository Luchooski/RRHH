import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  listPayrolls, getById, createPayroll, updateById, removePayroll, approvePayroll,
} from './payroll.service.js';

// ---------- Zod ----------
const Err = z.object({ error: z.object({ code: z.string(), message: z.string() }) });

const Payroll = z.object({
  id: z.string(),
  employeeId: z.string(),
  employeeName: z.string(),
  period: z.string(), // 'YYYY-MM'
  baseSalary: z.number(),
  bonuses: z.number().default(0),
  overtimeHours: z.number().default(0),
  overtimeRate: z.number().default(0),
  deductions: z.number().default(0),
  taxRate: z.number().default(0),
  contributionsRate: z.number().default(0),
  status: z.enum(['Borrador','Aprobado']).default('Borrador'),
  concepts: z.array(z.any()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const QueryList = z.object({
  period: z.string().optional(),
  employee: z.string().optional(),
  status: z.enum(['Borrador', 'Aprobado']).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  skip: z.coerce.number().int().min(0).optional(),
});

const PayrollCreate = Payroll.omit({ id: true, createdAt: true, updatedAt: true });
const PayrollUpdate = PayrollCreate.partial();

const ListOut = z.object({
  items: z.array(Payroll),
  total: z.number().int().nonnegative(),
  limit: z.number().int().nonnegative(),
  skip: z.number().int().nonnegative(),
});

// ---------- helper: mapear salida a schema ----------
function mapOut(i: any) {
  return {
    id: String(i.id ?? i._id),
    employeeId: i.employeeId,
    employeeName: i.employeeName,
    period: i.period,
    baseSalary: i.baseSalary,
    bonuses: i.bonuses ?? 0,
    overtimeHours: i.overtimeHours ?? 0,
    overtimeRate: i.overtimeRate ?? 0,
    deductions: i.deductions ?? 0,
    taxRate: i.taxRate ?? 0,
    contributionsRate: i.contributionsRate ?? 0,
    status: i.status ?? 'Borrador',
    concepts: Array.isArray(i.concepts) ? i.concepts.map((c: any) => ({ ...c })) : [],
    createdAt: typeof i.createdAt === 'string' ? i.createdAt : new Date(i.createdAt).toISOString(),
    updatedAt: typeof i.updatedAt === 'string' ? i.updatedAt : new Date(i.updatedAt).toISOString(),
  };
}

// ---------- plugin ----------
const payrollRoutes: FastifyPluginAsync = async (app) => {
  const r = app.withTypeProvider<ZodTypeProvider>();

  // LIST (paginado)
  r.route({
    method: 'GET',
    url: '/payrolls',
    schema: { querystring: QueryList, response: { 200: ListOut } },
    handler: async (req) => {
      const { period, employee, status, limit, skip } = req.query;
      const res = await listPayrolls({ period, employee, status, limit, skip });
      return {
        items: res.items.map(mapOut),
        total: res.total,
        limit: res.limit,
        skip: res.skip,
      };
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
      if (!found) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Payroll not found' } });
      return mapOut(found);
    },
  });

  // CREATE
  r.route({
    method: 'POST',
    url: '/payrolls',
    schema: { body: PayrollCreate, response: { 201: Payroll, 400: Err } },
    handler: async (req, reply) => {
      const created = await createPayroll(req.body);
      reply.code(201);
      return mapOut(created);
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
      if (!updated) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Payroll not found' } });
      return mapOut(updated);
    },
  });

  // APPROVE
  r.route({
    method: 'PATCH',
    url: '/payrolls/:id/approve',
    schema: { response: { 200: Payroll, 404: Err } },
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      const updated = await approvePayroll(id);
      if (!updated) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Payroll not found' } });
      return mapOut(updated);
    },
  });

  // DELETE
  r.route({
    method: 'DELETE',
    url: '/payrolls/:id',
    schema: { response: { 200: z.object({ ok: z.boolean() }), 404: Err } },
    handler: async (req) => {
      const { id } = req.params as { id: string };
      await removePayroll(id);
      return { ok: true };
    },
  });

  // Alias español (opcional)
  r.route({
    method: 'GET',
    url: '/liquidaciones',
    schema: { querystring: QueryList, response: { 200: ListOut } },
    handler: async (req) => {
      const { period, employee, status, limit, skip } = req.query;
      const res = await listPayrolls({ period, employee, status, limit, skip });
      return {
        items: res.items.map(mapOut),
        total: res.total,
        limit: res.limit,
        skip: res.skip,
      };
    },
  });
};

export { payrollRoutes };
export default payrollRoutes;
