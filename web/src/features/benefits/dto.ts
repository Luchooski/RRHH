// Benefit types
export type BenefitType =
  | 'health_insurance'
  | 'life_insurance'
  | 'meal_vouchers'
  | 'transport'
  | 'education'
  | 'gym'
  | 'remote_work'
  | 'flexible_hours'
  | 'bonus'
  | 'stock_options'
  | 'vacation_extra'
  | 'phone'
  | 'laptop'
  | 'other';

export type BenefitFrequency = 'one_time' | 'monthly' | 'quarterly' | 'yearly';
export type BenefitStatus = 'active' | 'inactive' | 'suspended';
export type EmployeeBenefitStatus = 'pending' | 'active' | 'cancelled' | 'rejected';

// Labels for UI
export const BENEFIT_TYPE_LABELS: Record<BenefitType, string> = {
  health_insurance: 'Seguro Médico',
  life_insurance: 'Seguro de Vida',
  meal_vouchers: 'Vales de Comida',
  transport: 'Transporte',
  education: 'Educación/Capacitación',
  gym: 'Gimnasio',
  remote_work: 'Trabajo Remoto',
  flexible_hours: 'Horario Flexible',
  bonus: 'Bono',
  stock_options: 'Opciones de Acciones',
  vacation_extra: 'Días Extra de Vacaciones',
  phone: 'Teléfono Móvil',
  laptop: 'Laptop',
  other: 'Otro',
};

export const BENEFIT_FREQUENCY_LABELS: Record<BenefitFrequency, string> = {
  one_time: 'Una vez',
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  yearly: 'Anual',
};

export const BENEFIT_STATUS_LABELS: Record<BenefitStatus, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  suspended: 'Suspendido',
};

export const EMPLOYEE_BENEFIT_STATUS_LABELS: Record<EmployeeBenefitStatus, string> = {
  pending: 'Pendiente',
  active: 'Activo',
  cancelled: 'Cancelado',
  rejected: 'Rechazado',
};

// Color classes for status badges
export const BENEFIT_STATUS_COLORS: Record<BenefitStatus, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  suspended: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
};

export const EMPLOYEE_BENEFIT_STATUS_COLORS: Record<EmployeeBenefitStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

// Icons for benefit types
export const BENEFIT_TYPE_ICONS: Record<BenefitType, string> = {
  health_insurance: '🏥',
  life_insurance: '🛡️',
  meal_vouchers: '🍽️',
  transport: '🚗',
  education: '📚',
  gym: '💪',
  remote_work: '🏠',
  flexible_hours: '⏰',
  bonus: '💰',
  stock_options: '📈',
  vacation_extra: '🏖️',
  phone: '📱',
  laptop: '💻',
  other: '📦',
};

// Interfaces
export interface Benefit {
  _id: string;
  tenantId: string;
  name: string;
  description?: string;
  type: BenefitType;
  costToCompany: number;
  costToEmployee: number;
  frequency: BenefitFrequency;
  currency: string;
  eligibility: {
    minMonthsEmployment?: number;
    roles?: string[];
    employmentType?: string[];
    departments?: string[];
  };
  provider?: string;
  providerContact?: string;
  terms?: string;
  status: BenefitStatus;
  isOptional: boolean;
  requiresApproval: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeBenefit {
  _id: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;
  benefitId: string;
  benefitName: string;
  benefitType: BenefitType;
  startDate: string;
  endDate?: string;
  costToCompany: number;
  costToEmployee: number;
  frequency: BenefitFrequency;
  currency: string;
  status: EmployeeBenefitStatus;
  requestedAt: string;
  requestedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BenefitsCostSummary {
  totalCostToCompany: number;
  totalCostToEmployee: number;
  currency: string;
  byType: Record<string, { count: number; costToCompany: number; costToEmployee: number }>;
  byEmployee: Array<{
    employeeId: string;
    employeeName: string;
    totalCost: number;
    benefitsCount: number;
  }>;
}

// Input types
export interface CreateBenefitInput {
  name: string;
  description?: string;
  type: BenefitType;
  costToCompany: number;
  costToEmployee?: number;
  frequency: BenefitFrequency;
  currency?: string;
  eligibility?: {
    minMonthsEmployment?: number;
    roles?: string[];
    employmentType?: string[];
    departments?: string[];
  };
  provider?: string;
  providerContact?: string;
  terms?: string;
  isOptional?: boolean;
  requiresApproval?: boolean;
}

export interface UpdateBenefitInput {
  name?: string;
  description?: string;
  costToCompany?: number;
  costToEmployee?: number;
  frequency?: BenefitFrequency;
  currency?: string;
  eligibility?: {
    minMonthsEmployment?: number;
    roles?: string[];
    employmentType?: string[];
    departments?: string[];
  };
  provider?: string;
  providerContact?: string;
  terms?: string;
  status?: BenefitStatus;
  isOptional?: boolean;
  requiresApproval?: boolean;
}

export interface AssignBenefitInput {
  employeeId: string;
  benefitId: string;
  startDate: string;
  endDate?: string;
  costToCompany?: number;
  costToEmployee?: number;
  notes?: string;
}
