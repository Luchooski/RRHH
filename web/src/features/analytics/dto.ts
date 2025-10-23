// Dashboard KPIs Types

export interface DashboardKPIs {
  recruitment: RecruitmentMetrics;
  employees: EmployeeMetrics;
  attendance: AttendanceMetrics;
  leaves: LeaveMetrics;
  benefits: BenefitsMetrics;
}

export interface RecruitmentMetrics {
  totalCandidates: number;
  activeVacancies: number;
  applicationsThisMonth: number;
  avgTimeToHire: number;
  candidatesByStage: Record<string, number>;
}

export interface EmployeeMetrics {
  totalActive: number;
  newHiresThisMonth: number;
  newHiresThisYear: number;
  byDepartment: Array<{ department: string; count: number }>;
  byPosition: Array<{ position: string; count: number }>;
}

export interface AttendanceMetrics {
  avgAttendanceRate: number;
  totalHoursThisMonth: number;
  lateArrivals: number;
  earlyDepartures: number;
}

export interface LeaveMetrics {
  pendingApproval: number;
  approvedThisMonth: number;
  rejectedThisMonth: number;
  byType: Record<string, number>;
}

export interface BenefitsMetrics {
  totalMonthlyCost: number;
  activeAssignments: number;
  costPerEmployee: number;
  byType: Record<string, number>;
}

// Trend Data Types

export interface TrendDataPoint {
  date: string;
  value: number;
}

// Query Params

export interface TrendQueryParams {
  months?: number;
  days?: number;
}

// UI Labels for Candidate Stages

export const CANDIDATE_STAGE_LABELS: Record<string, string> = {
  application_received: 'Aplicación Recibida',
  screening: 'Screening',
  interview_scheduled: 'Entrevista Programada',
  interviewed: 'Entrevistado',
  offer_extended: 'Oferta Extendida',
  hired: 'Contratado',
  rejected: 'Rechazado',
  withdrawn: 'Retirado',
};

// UI Labels for Leave Types

export const LEAVE_TYPE_LABELS: Record<string, string> = {
  vacation: 'Vacaciones',
  sick_leave: 'Licencia por Enfermedad',
  personal: 'Personal',
  maternity: 'Maternidad',
  paternity: 'Paternidad',
  unpaid: 'Sin Goce de Sueldo',
  study: 'Estudio',
  bereavement: 'Duelo',
  other: 'Otro',
};

// UI Labels for Benefit Types

export const BENEFIT_TYPE_LABELS: Record<string, string> = {
  health_insurance: 'Seguro Médico',
  life_insurance: 'Seguro de Vida',
  meal_vouchers: 'Vales de Comida',
  transport: 'Transporte',
  education: 'Educación',
  gym: 'Gimnasio',
  remote_work: 'Trabajo Remoto',
  flexible_hours: 'Horario Flexible',
  bonus: 'Bonos',
  stock_options: 'Opciones de Acciones',
  vacation_extra: 'Días Extra de Vacaciones',
  phone: 'Teléfono',
  laptop: 'Laptop',
  other: 'Otro',
};
