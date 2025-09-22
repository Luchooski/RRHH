import { z } from 'zod';

export const PeriodRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

export const ConceptType = z.enum(['remunerativo','no_remunerativo','deduccion']);
export const ConceptMode = z.enum(['monto','porcentaje']);
export const CalcBase = z.enum(['imponible','bruto','neto_previo','personalizado']);
export const Phase = z.enum(['pre_tax','post_tax']);
export const RoundMode = z.enum(['none','nearest','down','up']);

export const ConceptDTO = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: ConceptType,
  mode: ConceptMode,
  value: z.number().min(0),
  base: CalcBase.default('imponible').optional(),
  phase: Phase.default('pre_tax').optional(),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
  roundMode: RoundMode.default('nearest').optional(),
  roundDecimals: z.number().int().min(0).max(4).default(2).optional(),
  priority: z.number().int().min(0).default(100).optional(),
  enabled: z.boolean().default(true).optional(),
  customBase: z.number().min(0).optional()
});
export type ConceptT = z.infer<typeof ConceptDTO>;

export const PayrollInputDTO = z.object({
  employeeId: z.string().min(1),
  employeeName: z.string().min(1),
  period: z.string().regex(PeriodRegex, 'Formato YYYY-MM'),
  baseSalary: z.number().min(0),
  bonuses: z.number().min(0).default(0),
  overtimeHours: z.number().min(0).default(0),
  overtimeRate: z.number().min(0).default(0),
  deductions: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100).default(0),
  contributionsRate: z.number().min(0).max(100).default(0),
  concepts: z.array(ConceptDTO).default([]).optional()
});

export const PayrollStatus = z.enum(['Borrador','Aprobado']);

export const PayrollDTO = PayrollInputDTO.extend({
  id: z.string(),
  status: PayrollStatus,
  createdAt: z.string(),
  updatedAt: z.string()
});

export const ListQueryDTO = z.object({
  period: z.string().regex(PeriodRegex).optional(),
  employee: z.string().optional(),
  status: PayrollStatus.optional(),
  limit: z.coerce.number().min(1).max(100).default(20).optional(),
  skip: z.coerce.number().min(0).default(0).optional()
});

export const IdParamDTO = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId')
});

/** PUT update: todo igual al input pero opcional, con al menos 1 campo */
export const PayrollUpdateDTO = PayrollInputDTO.partial()
  .extend({ concepts: z.array(ConceptDTO).optional() })
  .refine((v) => Object.keys(v).length > 0, { message: 'Debe incluir algún campo para actualizar' });

export const BulkCreateItemDTO = z.object({
  employeeId: z.string().min(1),
  employeeName: z.string().min(1),
  baseSalary: z.number().min(0)
});
export const BulkCreateDTO = z.object({
  period: z.string().regex(PeriodRegex),
  defaults: z.object({
    bonuses: z.number().min(0).default(0),
    overtimeHours: z.number().min(0).default(0),
    overtimeRate: z.number().min(0).default(0),
    deductions: z.number().min(0).default(0),
    taxRate: z.number().min(0).max(100).default(0),
    contributionsRate: z.number().min(0).max(100).default(0)
  }),
  concepts: z.array(ConceptDTO).default([]),
  employees: z.array(BulkCreateItemDTO).min(1).max(1000)
});

export const ExportQueryDTO = ListQueryDTO; // mismos filtros