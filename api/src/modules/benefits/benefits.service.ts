import { Benefit, IBenefit, EmployeeBenefit, IEmployeeBenefit, BenefitType, BenefitStatus, EmployeeBenefitStatus } from './benefits.model';
import { Employee } from '../employee/employee.model';

// ===== Benefit Catalog Management =====

export interface CreateBenefitInput {
  name: string;
  description?: string;
  type: BenefitType;
  costToCompany: number;
  costToEmployee?: number;
  frequency: 'one_time' | 'monthly' | 'quarterly' | 'yearly';
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
  frequency?: 'one_time' | 'monthly' | 'quarterly' | 'yearly';
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

/**
 * Crear un beneficio en el catálogo
 */
export async function createBenefit(tenantId: string, input: CreateBenefitInput): Promise<IBenefit> {
  const benefit = await Benefit.create({
    tenantId,
    ...input,
    status: 'active',
  });

  return benefit;
}

/**
 * Listar beneficios del catálogo
 */
export async function listBenefits(
  tenantId: string,
  filters: { type?: BenefitType; status?: BenefitStatus } = {}
): Promise<IBenefit[]> {
  const query: any = { tenantId };

  if (filters.type) query.type = filters.type;
  if (filters.status) query.status = filters.status;

  const benefits = await Benefit.find(query).sort({ name: 1 }).lean();
  return benefits as IBenefit[];
}

/**
 * Obtener un beneficio específico
 */
export async function getBenefit(tenantId: string, benefitId: string): Promise<IBenefit> {
  const benefit = await Benefit.findOne({ _id: benefitId, tenantId });

  if (!benefit) {
    throw new Error('Beneficio no encontrado');
  }

  return benefit;
}

/**
 * Actualizar un beneficio
 */
export async function updateBenefit(
  tenantId: string,
  benefitId: string,
  input: UpdateBenefitInput
): Promise<IBenefit> {
  const benefit = await Benefit.findOne({ _id: benefitId, tenantId });

  if (!benefit) {
    throw new Error('Beneficio no encontrado');
  }

  Object.assign(benefit, input);
  await benefit.save();

  return benefit;
}

/**
 * Eliminar un beneficio
 */
export async function deleteBenefit(tenantId: string, benefitId: string): Promise<void> {
  // Verificar que no tenga asignaciones activas
  const activeAssignments = await EmployeeBenefit.countDocuments({
    tenantId,
    benefitId,
    status: 'active',
  });

  if (activeAssignments > 0) {
    throw new Error('No se puede eliminar un beneficio con asignaciones activas');
  }

  await Benefit.findOneAndDelete({ _id: benefitId, tenantId });
}

// ===== Employee Benefit Assignment =====

export interface AssignBenefitInput {
  employeeId: string;
  benefitId: string;
  startDate: string;
  endDate?: string;
  costToCompany?: number;      // Override catalog cost if needed
  costToEmployee?: number;     // Override catalog cost if needed
  notes?: string;
  requestedBy: string;
}

/**
 * Asignar un beneficio a un empleado
 */
export async function assignBenefit(
  tenantId: string,
  input: AssignBenefitInput
): Promise<IEmployeeBenefit> {
  // Verificar que el beneficio existe
  const benefit = await Benefit.findOne({ _id: input.benefitId, tenantId });
  if (!benefit) {
    throw new Error('Beneficio no encontrado');
  }

  if (benefit.status !== 'active') {
    throw new Error('El beneficio no está activo');
  }

  // Verificar que el empleado existe
  const employee = await Employee.findOne({ _id: input.employeeId, tenantId });
  if (!employee) {
    throw new Error('Empleado no encontrado');
  }

  // Verificar elegibilidad
  const isEligible = await checkEligibility(tenantId, input.employeeId, benefit);
  if (!isEligible.eligible) {
    throw new Error(`Empleado no elegible: ${isEligible.reason}`);
  }

  // Verificar si ya tiene este beneficio activo
  const existing = await EmployeeBenefit.findOne({
    tenantId,
    employeeId: input.employeeId,
    benefitId: input.benefitId,
    status: { $in: ['active', 'pending'] },
  });

  if (existing) {
    throw new Error('El empleado ya tiene este beneficio asignado o pendiente');
  }

  // Crear asignación
  const assignment = await EmployeeBenefit.create({
    tenantId,
    employeeId: input.employeeId,
    employeeName: `${employee.firstName} ${employee.lastName}`,
    benefitId: input.benefitId,
    benefitName: benefit.name,
    benefitType: benefit.type,
    startDate: new Date(input.startDate),
    endDate: input.endDate ? new Date(input.endDate) : undefined,
    costToCompany: input.costToCompany ?? benefit.costToCompany,
    costToEmployee: input.costToEmployee ?? benefit.costToEmployee,
    frequency: benefit.frequency,
    currency: benefit.currency,
    status: benefit.requiresApproval ? 'pending' : 'active',
    requestedAt: new Date(),
    requestedBy: input.requestedBy,
    notes: input.notes,
  });

  return assignment;
}

/**
 * Verificar elegibilidad de un empleado para un beneficio
 */
export async function checkEligibility(
  tenantId: string,
  employeeId: string,
  benefit: IBenefit
): Promise<{ eligible: boolean; reason?: string }> {
  const employee = await Employee.findOne({ _id: employeeId, tenantId });
  if (!employee) {
    return { eligible: false, reason: 'Empleado no encontrado' };
  }

  const eligibility = benefit.eligibility;

  // Verificar antigüedad
  if (eligibility.minMonthsEmployment && employee.hireDate) {
    const monthsEmployed = Math.floor(
      (new Date().getTime() - new Date(employee.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    if (monthsEmployed < eligibility.minMonthsEmployment) {
      return {
        eligible: false,
        reason: `Requiere al menos ${eligibility.minMonthsEmployment} meses de antigüedad (tienes ${monthsEmployed})`,
      };
    }
  }

  // Verificar rol
  if (eligibility.roles && eligibility.roles.length > 0) {
    if (!employee.position || !eligibility.roles.includes(employee.position)) {
      return { eligible: false, reason: 'Rol no elegible' };
    }
  }

  // Verificar departamento
  if (eligibility.departments && eligibility.departments.length > 0) {
    if (!employee.department || !eligibility.departments.includes(employee.department)) {
      return { eligible: false, reason: 'Departamento no elegible' };
    }
  }

  return { eligible: true };
}

/**
 * Listar beneficios de un empleado
 */
export async function listEmployeeBenefits(
  tenantId: string,
  employeeId: string,
  filters: { status?: EmployeeBenefitStatus } = {}
): Promise<IEmployeeBenefit[]> {
  const query: any = { tenantId, employeeId };

  if (filters.status) query.status = filters.status;

  const benefits = await EmployeeBenefit.find(query).sort({ startDate: -1 }).lean();
  return benefits as IEmployeeBenefit[];
}

/**
 * Aprobar/rechazar una solicitud de beneficio
 */
export async function approveBenefit(
  tenantId: string,
  assignmentId: string,
  approved: boolean,
  approvedBy: string,
  rejectionReason?: string
): Promise<IEmployeeBenefit> {
  const assignment = await EmployeeBenefit.findOne({ _id: assignmentId, tenantId });

  if (!assignment) {
    throw new Error('Asignación no encontrada');
  }

  if (assignment.status !== 'pending') {
    throw new Error('Solo se pueden aprobar/rechazar solicitudes pendientes');
  }

  assignment.status = approved ? 'active' : 'rejected';
  assignment.approvedBy = approvedBy;
  assignment.approvedAt = new Date();

  if (!approved && rejectionReason) {
    assignment.rejectionReason = rejectionReason;
  }

  await assignment.save();
  return assignment;
}

/**
 * Cancelar un beneficio asignado
 */
export async function cancelBenefit(
  tenantId: string,
  assignmentId: string,
  reason?: string
): Promise<IEmployeeBenefit> {
  const assignment = await EmployeeBenefit.findOne({ _id: assignmentId, tenantId });

  if (!assignment) {
    throw new Error('Asignación no encontrada');
  }

  if (assignment.status === 'cancelled') {
    throw new Error('El beneficio ya está cancelado');
  }

  assignment.status = 'cancelled';
  assignment.endDate = new Date();
  if (reason) assignment.notes = (assignment.notes || '') + `\nCancelado: ${reason}`;

  await assignment.save();
  return assignment;
}

/**
 * Obtener resumen de costos de beneficios
 */
export async function getBenefitsCostSummary(
  tenantId: string,
  filters: { employeeId?: string; benefitType?: BenefitType } = {}
): Promise<{
  totalCostToCompany: number;
  totalCostToEmployee: number;
  currency: string;
  byType: Record<string, { count: number; costToCompany: number; costToEmployee: number }>;
  byEmployee: Array<{ employeeId: string; employeeName: string; totalCost: number; benefitsCount: number }>;
}> {
  const query: any = { tenantId, status: 'active' };

  if (filters.employeeId) query.employeeId = filters.employeeId;
  if (filters.benefitType) query.benefitType = filters.benefitType;

  const assignments = await EmployeeBenefit.find(query).lean();

  let totalCostToCompany = 0;
  let totalCostToEmployee = 0;
  const byType: Record<string, any> = {};
  const byEmployeeMap: Record<string, any> = {};

  assignments.forEach((assignment: any) => {
    // Calculate monthly cost for comparison
    let monthlyCostCompany = assignment.costToCompany;
    let monthlyCostEmployee = assignment.costToEmployee;

    if (assignment.frequency === 'yearly') {
      monthlyCostCompany /= 12;
      monthlyCostEmployee /= 12;
    } else if (assignment.frequency === 'quarterly') {
      monthlyCostCompany /= 3;
      monthlyCostEmployee /= 3;
    }

    totalCostToCompany += monthlyCostCompany;
    totalCostToEmployee += monthlyCostEmployee;

    // By type
    if (!byType[assignment.benefitType]) {
      byType[assignment.benefitType] = { count: 0, costToCompany: 0, costToEmployee: 0 };
    }
    byType[assignment.benefitType].count++;
    byType[assignment.benefitType].costToCompany += monthlyCostCompany;
    byType[assignment.benefitType].costToEmployee += monthlyCostEmployee;

    // By employee
    if (!byEmployeeMap[assignment.employeeId]) {
      byEmployeeMap[assignment.employeeId] = {
        employeeId: assignment.employeeId,
        employeeName: assignment.employeeName,
        totalCost: 0,
        benefitsCount: 0,
      };
    }
    byEmployeeMap[assignment.employeeId].totalCost += monthlyCostCompany;
    byEmployeeMap[assignment.employeeId].benefitsCount++;
  });

  const byEmployee = Object.values(byEmployeeMap).sort((a: any, b: any) => b.totalCost - a.totalCost);

  return {
    totalCostToCompany: Number(totalCostToCompany.toFixed(2)),
    totalCostToEmployee: Number(totalCostToEmployee.toFixed(2)),
    currency: 'ARS', // Default, could be made configurable
    byType,
    byEmployee: byEmployee.slice(0, 20), // Top 20
  };
}
