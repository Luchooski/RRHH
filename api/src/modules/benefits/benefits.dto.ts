import { z } from 'zod';

// Benefit Catalog DTOs

export const CreateBenefitSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  description: z.string().max(500).optional(),
  type: z.enum([
    'health_insurance', 'life_insurance', 'meal_vouchers', 'transport',
    'education', 'gym', 'remote_work', 'flexible_hours', 'bonus',
    'stock_options', 'vacation_extra', 'phone', 'laptop', 'other'
  ]),
  costToCompany: z.number().min(0),
  costToEmployee: z.number().min(0).default(0),
  frequency: z.enum(['one_time', 'monthly', 'quarterly', 'yearly']).default('monthly'),
  currency: z.string().default('ARS'),
  eligibility: z.object({
    minMonthsEmployment: z.number().int().min(0).optional(),
    roles: z.array(z.string()).optional(),
    employmentType: z.array(z.string()).optional(),
    departments: z.array(z.string()).optional(),
  }).optional(),
  provider: z.string().max(200).optional(),
  providerContact: z.string().max(200).optional(),
  terms: z.string().max(2000).optional(),
  isOptional: z.boolean().default(true),
  requiresApproval: z.boolean().default(false),
});

export const UpdateBenefitSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  costToCompany: z.number().min(0).optional(),
  costToEmployee: z.number().min(0).optional(),
  frequency: z.enum(['one_time', 'monthly', 'quarterly', 'yearly']).optional(),
  currency: z.string().optional(),
  eligibility: z.object({
    minMonthsEmployment: z.number().int().min(0).optional(),
    roles: z.array(z.string()).optional(),
    employmentType: z.array(z.string()).optional(),
    departments: z.array(z.string()).optional(),
  }).optional(),
  provider: z.string().max(200).optional(),
  providerContact: z.string().max(200).optional(),
  terms: z.string().max(2000).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  isOptional: z.boolean().optional(),
  requiresApproval: z.boolean().optional(),
});

export const BenefitIdParamsSchema = z.object({
  id: z.string(),
});

export const ListBenefitsQuerySchema = z.object({
  type: z.enum([
    'health_insurance', 'life_insurance', 'meal_vouchers', 'transport',
    'education', 'gym', 'remote_work', 'flexible_hours', 'bonus',
    'stock_options', 'vacation_extra', 'phone', 'laptop', 'other'
  ]).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

// Employee Benefit Assignment DTOs

export const AssignBenefitSchema = z.object({
  employeeId: z.string().min(1, 'ID de empleado requerido'),
  benefitId: z.string().min(1, 'ID de beneficio requerido'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)').optional(),
  costToCompany: z.number().min(0).optional(),
  costToEmployee: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
});

export const ApproveBenefitSchema = z.object({
  approved: z.boolean(),
  rejectionReason: z.string().max(500).optional(),
});

export const ListEmployeeBenefitsQuerySchema = z.object({
  employeeId: z.string().optional(),
  status: z.enum(['pending', 'active', 'cancelled', 'rejected']).optional(),
});

export const GetBenefitsCostSummaryQuerySchema = z.object({
  employeeId: z.string().optional(),
  benefitType: z.enum([
    'health_insurance', 'life_insurance', 'meal_vouchers', 'transport',
    'education', 'gym', 'remote_work', 'flexible_hours', 'bonus',
    'stock_options', 'vacation_extra', 'phone', 'laptop', 'other'
  ]).optional(),
});

export const CancelBenefitSchema = z.object({
  reason: z.string().max(500).optional(),
});

export type CreateBenefitInput = z.infer<typeof CreateBenefitSchema>;
export type UpdateBenefitInput = z.infer<typeof UpdateBenefitSchema>;
export type AssignBenefitInput = z.infer<typeof AssignBenefitSchema>;
