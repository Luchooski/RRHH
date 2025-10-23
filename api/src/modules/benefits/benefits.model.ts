import mongoose, { Schema, Document } from 'mongoose';

// Tipos de beneficios
export type BenefitType =
  | 'health_insurance'      // Seguro médico
  | 'life_insurance'        // Seguro de vida
  | 'meal_vouchers'         // Vales de comida
  | 'transport'             // Transporte/combustible
  | 'education'             // Educación/capacitación
  | 'gym'                   // Gimnasio
  | 'remote_work'           // Trabajo remoto
  | 'flexible_hours'        // Horario flexible
  | 'bonus'                 // Bonos
  | 'stock_options'         // Opciones de acciones
  | 'vacation_extra'        // Días extra de vacaciones
  | 'phone'                 // Teléfono móvil
  | 'laptop'                // Laptop
  | 'other';                // Otro

// Frecuencia de pago del beneficio
export type BenefitFrequency = 'one_time' | 'monthly' | 'quarterly' | 'yearly';

// Estado del beneficio
export type BenefitStatus = 'active' | 'inactive' | 'suspended';

// Interfaz del catálogo de beneficios
export interface IBenefit extends Document {
  tenantId: string;
  name: string;
  description?: string;
  type: BenefitType;

  // Costos
  costToCompany: number;      // Costo para la empresa por empleado
  costToEmployee: number;     // Costo para el empleado (si aplica)
  frequency: BenefitFrequency;
  currency: string;           // ARS, USD, etc.

  // Elegibilidad
  eligibility: {
    minMonthsEmployment?: number;   // Meses mínimos de antigüedad
    roles?: string[];                // Roles elegibles
    employmentType?: string[];       // full_time, part_time, contractor
    departments?: string[];          // Departamentos elegibles
  };

  // Detalles adicionales
  provider?: string;          // Nombre del proveedor (ej: OSDE, Galeno)
  providerContact?: string;   // Contacto del proveedor
  terms?: string;             // Términos y condiciones

  status: BenefitStatus;
  isOptional: boolean;        // Si es opcional para el empleado
  requiresApproval: boolean;  // Si requiere aprobación de HR

  createdAt: Date;
  updatedAt: Date;
}

const BenefitSchema = new Schema<IBenefit>({
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: String,
  type: {
    type: String,
    required: true,
    enum: [
      'health_insurance', 'life_insurance', 'meal_vouchers', 'transport',
      'education', 'gym', 'remote_work', 'flexible_hours', 'bonus',
      'stock_options', 'vacation_extra', 'phone', 'laptop', 'other'
    ],
    index: true,
  },

  costToCompany: { type: Number, required: true, default: 0 },
  costToEmployee: { type: Number, default: 0 },
  frequency: {
    type: String,
    enum: ['one_time', 'monthly', 'quarterly', 'yearly'],
    default: 'monthly',
  },
  currency: { type: String, default: 'ARS' },

  eligibility: {
    minMonthsEmployment: Number,
    roles: [String],
    employmentType: [String],
    departments: [String],
  },

  provider: String,
  providerContact: String,
  terms: String,

  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
    index: true,
  },
  isOptional: { type: Boolean, default: true },
  requiresApproval: { type: Boolean, default: false },
}, {
  timestamps: true,
});

// Índices
BenefitSchema.index({ tenantId: 1, name: 1 });
BenefitSchema.index({ tenantId: 1, type: 1 });
BenefitSchema.index({ tenantId: 1, status: 1 });

export const Benefit = mongoose.model<IBenefit>('Benefit', BenefitSchema);

// ===== Employee Benefit Assignment =====

export type EmployeeBenefitStatus = 'pending' | 'active' | 'cancelled' | 'rejected';

export interface IEmployeeBenefit extends Document {
  tenantId: string;
  employeeId: string;
  employeeName: string;       // Denormalized
  benefitId: string;
  benefitName: string;        // Denormalized
  benefitType: BenefitType;   // Denormalized

  // Fechas
  startDate: Date;
  endDate?: Date;             // Opcional, si es indefinido

  // Costos específicos (puede diferir del catálogo)
  costToCompany: number;
  costToEmployee: number;
  frequency: BenefitFrequency;
  currency: string;

  status: EmployeeBenefitStatus;

  // Aprobación
  requestedAt: Date;
  requestedBy: string;        // User ID quien solicitó
  approvedBy?: string;        // User ID quien aprobó
  approvedAt?: Date;
  rejectionReason?: string;

  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const EmployeeBenefitSchema = new Schema<IEmployeeBenefit>({
  tenantId: { type: String, required: true, index: true },
  employeeId: { type: String, required: true, index: true },
  employeeName: { type: String, required: true },
  benefitId: { type: String, required: true, index: true },
  benefitName: { type: String, required: true },
  benefitType: { type: String, required: true },

  startDate: { type: Date, required: true },
  endDate: Date,

  costToCompany: { type: Number, required: true },
  costToEmployee: { type: Number, default: 0 },
  frequency: { type: String, required: true },
  currency: { type: String, default: 'ARS' },

  status: {
    type: String,
    enum: ['pending', 'active', 'cancelled', 'rejected'],
    default: 'pending',
    index: true,
  },

  requestedAt: { type: Date, default: Date.now },
  requestedBy: String,
  approvedBy: String,
  approvedAt: Date,
  rejectionReason: String,

  notes: String,
}, {
  timestamps: true,
});

// Índices
EmployeeBenefitSchema.index({ tenantId: 1, employeeId: 1 });
EmployeeBenefitSchema.index({ tenantId: 1, benefitId: 1 });
EmployeeBenefitSchema.index({ tenantId: 1, status: 1 });
EmployeeBenefitSchema.index({ tenantId: 1, employeeId: 1, status: 1 });

export const EmployeeBenefit = mongoose.model<IEmployeeBenefit>('EmployeeBenefit', EmployeeBenefitSchema);
