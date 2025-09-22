import { z } from 'zod';

export const PeriodRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

export const ConceptType = z.enum(['remunerativo','no_remunerativo','deduccion']);
export const ConceptMode = z.enum(['monto','porcentaje']);
export const CalcBase = z.enum(['imponible','bruto','neto_previo','personalizado']);
export const Phase = z.enum(['pre_tax','post_tax']);
export const RoundMode = z.enum(['none','nearest','down','up']);

export const ConceptSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: ConceptType,
  mode: ConceptMode,
  value: z.number().min(0),
  base: CalcBase.optional().default('imponible'),
  phase: Phase.optional().default('pre_tax'),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
  roundMode: RoundMode.optional().default('nearest'),
  roundDecimals: z.number().int().min(0).max(4).optional().default(2),
  priority: z.number().int().min(0).optional().default(100),
  enabled: z.boolean().optional().default(true),
  customBase: z.number().min(0).optional()
});
export type Concept = z.infer<typeof ConceptSchema>;

export const PayrollInputSchema = z.object({
  employeeId: z.string().min(1, 'Empleado requerido'),
  employeeName: z.string().min(1, 'Empleado requerido'),
  period: z.string().regex(PeriodRegex, 'Formato YYYY-MM'),
  baseSalary: z.number().min(0),
  bonuses: z.number().min(0).default(0),
  overtimeHours: z.number().min(0).default(0),
  overtimeRate: z.number().min(0).default(0),
  deductions: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100).default(0),
  contributionsRate: z.number().min(0).max(100).default(0)
});
export type PayrollInput = z.infer<typeof PayrollInputSchema>;

export const PayrollStatus = z.enum(['Borrador','Aprobado']);

export const PayrollRecordSchema = PayrollInputSchema.extend({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  status: PayrollStatus.default('Borrador'),
  concepts: z.array(ConceptSchema).default([])
});
export type PayrollRecord = z.infer<typeof PayrollRecordSchema>;

/** NUEVO: múltiples plantillas con nombre */
export const TemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  concepts: z.array(ConceptSchema)
});
export type Template = z.infer<typeof TemplateSchema>;
