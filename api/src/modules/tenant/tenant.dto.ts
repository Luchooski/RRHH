import { z } from 'zod';

// Output DTO - lo que se devuelve al cliente
export const TenantOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  email: z.string().email(),
  status: z.enum(['active', 'inactive', 'suspended']),
  plan: z.enum(['free', 'basic', 'professional', 'enterprise']),
  settings: z.object({
    maxUsers: z.number().optional(),
    maxEmployees: z.number().optional(),
    features: z.array(z.string()).optional()
  }).optional(),
  branding: z.object({
    logo: z.string().optional(),
    primaryColor: z.string().optional(),
    description: z.string().optional()
  }).optional(),
  regional: z.object({
    language: z.string().optional(),
    country: z.string().optional(),
    timezone: z.string().optional(),
    currency: z.string().optional(),
    dateFormat: z.string().optional(),
    timeFormat: z.enum(['12h', '24h']).optional(),
    firstDayOfWeek: z.number().optional(),
    numberFormat: z.object({
      decimalSeparator: z.string().optional(),
      thousandsSeparator: z.string().optional()
    }).optional()
  }).optional(),
  policies: z.object({
    vacationDaysPerYear: z.number().optional(),
    sickDaysPerYear: z.number().optional(),
    workingHoursPerDay: z.number().optional(),
    workingDaysPerWeek: z.number().optional(),
    overtimeMultiplier: z.number().optional(),
    lateToleranceMinutes: z.number().optional(),
    autoApproveLeaves: z.boolean().optional()
  }).optional(),
  analytics: z.object({
    totalApplications: z.number().optional(),
    applicationsByCareersPage: z.number().optional(),
    applicationsThisMonth: z.number().optional(),
    lastApplicationDate: z.string().optional()
  }).optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type TenantOutput = z.infer<typeof TenantOutputSchema>;

// Input para registro de empresa (signup)
export const CreateTenantSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase().trim(),
  plan: z.enum(['free', 'basic', 'professional', 'enterprise']).default('free'),
  // Admin user data para crear el primer usuario
  adminUser: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email().toLowerCase().trim(),
    password: z.string().min(6).max(100)
  })
});

export type CreateTenantInput = z.infer<typeof CreateTenantSchema>;

// Input para actualización de tenant
export const UpdateTenantSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  plan: z.enum(['free', 'basic', 'professional', 'enterprise']).optional(),
  settings: z.object({
    maxUsers: z.number().min(1).max(1000).optional(),
    maxEmployees: z.number().min(1).max(10000).optional(),
    features: z.array(z.string()).optional()
  }).optional(),
  branding: z.object({
    logo: z.string().url().optional(),
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    description: z.string().max(500).optional()
  }).optional(),
  regional: z.object({
    language: z.string().regex(/^[a-z]{2}$/).optional(),
    country: z.string().regex(/^[A-Z]{2}$/).optional(),
    timezone: z.string().optional(),
    currency: z.string().regex(/^[A-Z]{3}$/).optional(),
    dateFormat: z.string().optional(),
    timeFormat: z.enum(['12h', '24h']).optional(),
    firstDayOfWeek: z.number().min(0).max(6).optional(),
    numberFormat: z.object({
      decimalSeparator: z.string().optional(),
      thousandsSeparator: z.string().optional()
    }).optional()
  }).optional(),
  policies: z.object({
    vacationDaysPerYear: z.number().min(0).max(365).optional(),
    sickDaysPerYear: z.number().min(0).max(365).optional(),
    workingHoursPerDay: z.number().min(1).max(24).optional(),
    workingDaysPerWeek: z.number().min(1).max(7).optional(),
    overtimeMultiplier: z.number().min(1.0).max(3.0).optional(),
    lateToleranceMinutes: z.number().min(0).max(60).optional(),
    autoApproveLeaves: z.boolean().optional()
  }).optional()
});

export type UpdateTenantInput = z.infer<typeof UpdateTenantSchema>;

// Error DTO
export const ErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional()
  })
});
