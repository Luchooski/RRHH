import { z } from 'zod';

// ===== SUB-SCHEMAS =====

export const AddressSchema = z.object({
  street: z.string().trim().optional(),
  number: z.string().trim().optional(),
  floor: z.string().trim().optional(),
  apartment: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  country: z.string().trim().optional().default('Argentina')
}).optional();

export const EmergencyContactSchema = z.object({
  name: z.string().trim().optional(),
  relationship: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  alternativePhone: z.string().trim().optional()
}).optional();

export const BankInfoSchema = z.object({
  bankName: z.string().trim().optional(),
  accountType: z.enum(['savings', 'checking']).optional(),
  cbu: z.string().trim().optional(),
  alias: z.string().trim().optional()
}).optional();

export const JobHistoryItemSchema = z.object({
  position: z.string().min(2),
  department: z.string().optional(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).optional(),
  salary: z.number().optional(),
  notes: z.string().optional()
});

// ===== INPUT SCHEMA =====

export const EmployeeInputSchema = z.object({
  // Datos básicos (requeridos)
  name: z.string().min(2).trim(),
  email: z.string().email(),
  role: z.string().min(2).trim(),
  baseSalary: z.number().nonnegative().default(0),
  monthlyHours: z.number().int().positive().default(160),

  // Datos básicos opcionales
  phone: z.string().trim().optional(),

  // Datos personales
  dni: z.string().trim().optional(),
  cuil: z.string().trim().optional(),
  dateOfBirth: z.string().or(z.date()).optional(),
  gender: z.enum(['M', 'F', 'X', 'other', '']).optional(),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed', 'other', '']).optional(),
  nationality: z.string().trim().optional(),

  // Dirección
  address: AddressSchema,

  // Contacto de emergencia
  emergencyContact: EmergencyContactSchema,

  // Datos laborales adicionales
  department: z.string().trim().optional(),
  managerId: z.string().length(24).optional(),
  hireDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional(),
  contractType: z.enum(['fulltime', 'parttime', 'contract', 'temporary', 'intern', '']).optional(),

  // Estado
  status: z.enum(['active', 'on_leave', 'suspended', 'terminated']).optional().default('active'),

  // Información financiera
  bankInfo: BankInfoSchema,
  healthInsurance: z.string().trim().optional(),
  taxId: z.string().trim().optional(),

  // Información adicional
  photo: z.string().url().optional(),
  skills: z.array(z.string().trim()).optional(),
  certifications: z.array(z.string().trim()).optional(),

  // Notas
  notes: z.string().optional()
});

// ===== UPDATE SCHEMA (todos los campos opcionales) =====

export const EmployeeUpdateSchema = z.object({
  // Datos básicos
  name: z.string().min(2).trim().optional(),
  email: z.string().email().optional(),
  role: z.string().min(2).trim().optional(),
  baseSalary: z.number().nonnegative().optional(),
  monthlyHours: z.number().int().positive().optional(),
  phone: z.string().trim().optional(),

  // Datos personales
  dni: z.string().trim().optional(),
  cuil: z.string().trim().optional(),
  dateOfBirth: z.string().or(z.date()).optional(),
  gender: z.enum(['M', 'F', 'X', 'other', '']).optional(),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed', 'other', '']).optional(),
  nationality: z.string().trim().optional(),

  // Dirección
  address: AddressSchema,

  // Contacto de emergencia
  emergencyContact: EmergencyContactSchema,

  // Datos laborales adicionales
  department: z.string().trim().optional(),
  managerId: z.string().length(24).optional(),
  hireDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional(),
  contractType: z.enum(['fulltime', 'parttime', 'contract', 'temporary', 'intern', '']).optional(),

  // Estado
  status: z.enum(['active', 'on_leave', 'suspended', 'terminated']).optional(),

  // Información financiera
  bankInfo: BankInfoSchema,
  healthInsurance: z.string().trim().optional(),
  taxId: z.string().trim().optional(),

  // Información adicional
  photo: z.string().url().optional(),
  skills: z.array(z.string().trim()).optional(),
  certifications: z.array(z.string().trim()).optional(),

  // Notas
  notes: z.string().optional()
});

// ===== OUTPUT SCHEMA =====

export const EmployeeOutputSchema = z.object({
  id: z.string(),

  // Datos básicos
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  phone: z.string().optional(),

  // Datos personales
  dni: z.string().optional(),
  cuil: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  maritalStatus: z.string().optional(),
  nationality: z.string().optional(),

  // Dirección
  address: z.object({
    street: z.string().optional(),
    number: z.string().optional(),
    floor: z.string().optional(),
    apartment: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional()
  }).optional(),

  // Contacto de emergencia
  emergencyContact: z.object({
    name: z.string().optional(),
    relationship: z.string().optional(),
    phone: z.string().optional(),
    alternativePhone: z.string().optional()
  }).optional(),

  // Datos laborales
  department: z.string().optional(),
  managerId: z.string().optional(),
  hireDate: z.string().optional(),
  endDate: z.string().optional(),
  baseSalary: z.number(),
  monthlyHours: z.number().int(),
  contractType: z.string().optional(),

  // Estado
  status: z.string(),

  // Información financiera
  bankInfo: z.object({
    bankName: z.string().optional(),
    accountType: z.string().optional(),
    cbu: z.string().optional(),
    alias: z.string().optional()
  }).optional(),
  healthInsurance: z.string().optional(),
  taxId: z.string().optional(),

  // Información adicional
  photo: z.string().optional(),
  skills: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),

  // Job history
  jobHistory: z.array(z.object({
    position: z.string(),
    department: z.string().optional(),
    startDate: z.string(),
    endDate: z.string().optional(),
    salary: z.number().optional(),
    notes: z.string().optional()
  })).optional(),

  // Notas
  notes: z.string().optional(),

  // Timestamps
  createdAt: z.string(),
  updatedAt: z.string()
});

// ===== OTHER SCHEMAS =====

export const EmployeeIdSchema = z.object({ id: z.string().length(24) });

export const EmployeesListSchema = z.array(EmployeeOutputSchema);

// ===== QUERY PARAMS =====

export const EmployeeQuerySchema = z.object({
  search: z.string().optional(),
  department: z.string().optional(),
  status: z.enum(['active', 'on_leave', 'suspended', 'terminated']).optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  skip: z.coerce.number().int().nonnegative().default(0)
});

// ===== TYPES =====

export type EmployeeInput = z.infer<typeof EmployeeInputSchema>;
export type EmployeeUpdate = z.infer<typeof EmployeeUpdateSchema>;
export type EmployeeOutput = z.infer<typeof EmployeeOutputSchema>;
export type EmployeeQuery = z.infer<typeof EmployeeQuerySchema>;
