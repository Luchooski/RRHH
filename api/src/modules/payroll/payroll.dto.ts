import { z } from 'zod';

export const ConceptSchema = z.object({
  code: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['remunerativo', 'no_remunerativo', 'indemnizacion']),
  amount: z.number().nonnegative(),
  taxable: z.boolean().default(true),
});

export const DeductionSchema = z.object({
  code: z.string().min(1),
  label: z.string().min(1),
  amount: z.number().nonnegative(),
});

export const HistorySchema = z.object({
  action: z.enum(['created', 'updated', 'approved', 'paid', 'canceled']),
  by: z.string().min(1),
  at: z.coerce.date(),
  notes: z.string().optional(),
});

export const PayrollBaseSchema = z.object({
  employeeId: z.string().min(1),
  employeeName: z.string().min(1),
  position: z.string().optional(),
  department: z.string().optional(),
  seniority: z.enum(['jr', 'ssr', 'sr']).optional(),
  hireDate: z.coerce.date().optional(),
  terminationDate: z.coerce.date().nullable().optional(),
  contractType: z.enum(['indefinido', 'plazo_fijo', 'freelance']).optional(),
  workHours: z.number().int().positive().optional(),

  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Formato esperado YYYY-MM'),
  type: z.enum(['mensual', 'final', 'extraordinaria', 'vacaciones']).default('mensual'),
  status: z.enum(['pendiente', 'aprobada', 'pagada', 'anulada']).default('pendiente'),

  baseSalary: z.number().nonnegative(),
  concepts: z.array(ConceptSchema).default([]),
  deductions: z.array(DeductionSchema).default([]),

  grossTotal: z.number().nonnegative(),
  deductionsTotal: z.number().nonnegative(),
  netTotal: z.number().nonnegative(),
  employerCostTotal: z.number().nonnegative().optional(),
  currency: z.string().default('ARS'),

  paymentMethod: z.enum(['transferencia', 'efectivo', 'cheque', 'otro']).optional(),
  bankAccount: z.string().optional(),
  paymentDate: z.coerce.date().optional(),
  receiptUrl: z.string().url().optional(),

  notes: z.string().optional(),
  approvedBy: z.string().optional(),
  history: z.array(HistorySchema).default([]),
});

export const PayrollCreateSchema = PayrollBaseSchema;
export const PayrollOutputSchema = PayrollBaseSchema.extend({
  id: z.string(),           // mapearás _id -> id en controller
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const PayrollQuerySchema = z.object({
  q: z.string().optional(),
  employeeId: z.string().optional(),
  status: z.enum(['pendiente', 'aprobada', 'pagada', 'anulada']).optional(),
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
  from: z.string().optional(), // ISO date
  to: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  skip: z.coerce.number().min(0).default(0),
  sortField: z.enum(['createdAt', 'updatedAt', 'period', 'netTotal']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

export const PayrollStatusSchema = z.object({
  status: z.enum(['pendiente', 'aprobada', 'pagada', 'anulada']),
});
