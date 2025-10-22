import { z } from 'zod';

// Output DTO - lo que se devuelve al cliente
export const TenantOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  status: z.enum(['active', 'inactive', 'suspended']),
  plan: z.enum(['free', 'basic', 'professional', 'enterprise']),
  settings: z.object({
    maxUsers: z.number().optional(),
    maxEmployees: z.number().optional(),
    features: z.array(z.string()).optional()
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
