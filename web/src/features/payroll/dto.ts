import { z } from 'zod';

export const Status = z.enum(['pendiente','aprobada','pagada','anulada','Borrador','Aprobado']);
export type Status = z.infer<typeof Status>;

export const Concept = z.object({
  code: z.string(),
  label: z.string(),
  type: z.enum(['remunerativo','no_remunerativo','indemnizacion']),
  amount: z.number(),
  taxable: z.boolean(),
});
export const Deduction = z.object({
  code: z.string(),
  label: z.string(),
  amount: z.number(),
});

export const Payroll = z.object({
  id: z.string(),
  employeeId: z.string(),
  employeeName: z.string(),
  period: z.string(),
  type: z.enum(['mensual','final','extraordinaria','vacaciones']),
  status: Status,
  baseSalary: z.number(),
  concepts: z.array(Concept),
  deductions: z.array(Deduction),
  grossTotal: z.number(),
  deductionsTotal: z.number(),
  netTotal: z.number(),
  currency: z.string(),
  paymentMethod: z.enum(['transferencia','efectivo','cheque','otro']).optional(),
  bankAccount: z.string().optional(),
  paymentDate: z.string().optional(),
  receiptUrl: z.string().optional(),
  notes: z.string().optional(),
  approvedBy: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Payroll = z.infer<typeof Payroll>;

export const ListOut = z.object({
  items: z.array(Payroll),
  total: z.number(),
  limit: z.number(),
  skip: z.number(),
});
export type ListOut = z.infer<typeof ListOut>;
