import { z } from 'zod';

// ===== ENUMS =====

export const LeaveTypeEnum = z.enum([
  'vacation',
  'sick',
  'personal',
  'maternity',
  'paternity',
  'bereavement',
  'study',
  'unpaid',
  'other'
]);

export const LeaveStatusEnum = z.enum([
  'pending',
  'approved',
  'rejected',
  'cancelled'
]);

// ===== INPUT SCHEMAS =====

export const LeaveRequestSchema = z.object({
  employeeId: z.string().length(24),
  type: LeaveTypeEnum,
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  halfDay: z.boolean().optional().default(false),
  reason: z.string().trim().optional(),
  description: z.string().optional(),
  attachments: z.array(z.string().url()).optional()
});

export const LeaveUpdateSchema = z.object({
  type: LeaveTypeEnum.optional(),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional(),
  halfDay: z.boolean().optional(),
  reason: z.string().trim().optional(),
  description: z.string().optional(),
  attachments: z.array(z.string().url()).optional(),
  notes: z.string().optional()
});

export const LeaveApprovalSchema = z.object({
  approved: z.boolean(),
  reason: z.string().optional() // Razón del rechazo si aplica
});

// ===== OUTPUT SCHEMA =====

export const LeaveOutputSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  employeeId: z.string(),
  employeeName: z.string(),

  type: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  days: z.number(),
  halfDay: z.boolean(),

  reason: z.string().optional(),
  description: z.string().optional(),

  status: z.string(),
  requestedAt: z.string(),
  approvedBy: z.string().optional(),
  approvedByName: z.string().optional(),
  approvedAt: z.string().optional(),
  rejectedReason: z.string().optional(),

  attachments: z.array(z.string()).optional(),
  notes: z.string().optional(),

  createdAt: z.string(),
  updatedAt: z.string()
});

// ===== QUERY SCHEMA =====

export const LeaveQuerySchema = z.object({
  employeeId: z.string().length(24).optional(),
  type: LeaveTypeEnum.optional(),
  status: LeaveStatusEnum.optional(),
  startDate: z.string().optional(), // Filtrar desde esta fecha
  endDate: z.string().optional(),   // Filtrar hasta esta fecha
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  skip: z.coerce.number().int().nonnegative().default(0)
});

// ===== CALENDAR SUMMARY SCHEMA =====

export const LeaveBalanceSchema = z.object({
  employeeId: z.string(),
  employeeName: z.string(),
  year: z.number(),

  vacation: z.object({
    total: z.number(),      // Total de días de vacaciones al año
    used: z.number(),       // Días usados
    pending: z.number(),    // Días en solicitudes pendientes
    available: z.number()   // Días disponibles
  }),

  sick: z.object({
    used: z.number(),
    pending: z.number()
  }),

  other: z.object({
    used: z.number(),
    pending: z.number()
  })
});

// ===== TYPES =====

export type LeaveRequest = z.infer<typeof LeaveRequestSchema>;
export type LeaveUpdate = z.infer<typeof LeaveUpdateSchema>;
export type LeaveApproval = z.infer<typeof LeaveApprovalSchema>;
export type LeaveOutput = z.infer<typeof LeaveOutputSchema>;
export type LeaveQuery = z.infer<typeof LeaveQuerySchema>;
export type LeaveBalance = z.infer<typeof LeaveBalanceSchema>;
