import { Attendance } from '../attendance/attendance.model.js';
import { EmployeeBenefit } from '../benefits/benefits.model.js';
import { Employee } from '../employee/employee.model.js';
import { Concept, Deduction } from './payroll.model.js';

/**
 * Servicio de cálculo automático de conceptos de liquidación
 * Integra datos de Attendance y Benefits para generar conceptos y deducciones
 */

export interface AutoCalcResult {
  concepts: Concept[];
  deductions: Deduction[];
  summary: {
    totalConcepts: number;
    totalDeductions: number;
    totalHoursWorked: number;
    totalOvertimeHours: number;
    daysAbsent: number;
    daysLate: number;
  };
}

/**
 * Calcula automáticamente todos los conceptos y deducciones para un empleado en un período
 */
export async function calculatePayrollConcepts(
  tenantId: string,
  employeeId: string,
  period: string, // YYYY-MM
  baseSalary: number,
  options: {
    includeOvertime?: boolean;
    includePresenteeism?: boolean;
    includeAbsenceDeductions?: boolean;
    includeBenefitsDeductions?: boolean;
    overtimeRate?: number; // Multiplicador para horas extra (ej: 1.5)
    absenceDeductionRate?: number; // Porcentaje de descuento por día ausente
  } = {}
): Promise<AutoCalcResult> {
  const {
    includeOvertime = true,
    includePresenteeism = true,
    includeAbsenceDeductions = true,
    includeBenefitsDeductions = true,
    overtimeRate = 1.5,
    absenceDeductionRate = 1.0, // 100% = 1 día de sueldo por ausencia
  } = options;

  const concepts: Concept[] = [];
  const deductions: Deduction[] = [];

  // Parse period (YYYY-MM)
  const [year, month] = period.split('-').map(Number);
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  // 1. Obtener datos de asistencia del período
  const attendanceRecords = await Attendance.find({
    tenantId,
    employeeId,
    date: { $gte: startDate, $lte: endDate },
  }).lean();

  // 2. Calcular totales de asistencia
  let totalHoursWorked = 0;
  let totalOvertimeHours = 0;
  let totalRegularHours = 0;
  let daysPresent = 0;
  let daysAbsent = 0;
  let daysLate = 0;

  attendanceRecords.forEach((att: any) => {
    totalHoursWorked += att.hoursWorked || 0;
    totalRegularHours += att.regularHours || 0;
    totalOvertimeHours += att.overtimeHours || 0;

    if (att.status === 'present') daysPresent++;
    if (att.status === 'absent') daysAbsent++;
    if (att.status === 'late') daysLate++;
  });

  // 3. CONCEPTO: Horas extra
  if (includeOvertime && totalOvertimeHours > 0) {
    // Calcular valor hora: baseSalary / 22 días / 8 horas (aproximado)
    const hourlyRate = baseSalary / 22 / 8;
    const overtimeAmount = totalOvertimeHours * hourlyRate * overtimeRate;

    concepts.push({
      code: 'OT',
      label: `Horas Extra (${totalOvertimeHours.toFixed(2)}hs x ${overtimeRate}x)`,
      type: 'remunerativo',
      amount: Number(overtimeAmount.toFixed(2)),
      taxable: true,
    });
  }

  // 4. CONCEPTO: Bono por presentismo
  if (includePresenteeism && daysAbsent === 0 && daysLate === 0) {
    const presenteeismBonus = baseSalary * 0.10; // 10% del sueldo base
    concepts.push({
      code: 'PRES',
      label: 'Bono Presentismo (sin ausencias ni tardanzas)',
      type: 'no_remunerativo',
      amount: Number(presenteeismBonus.toFixed(2)),
      taxable: false,
    });
  }

  // 5. DEDUCCIÓN: Descuentos por ausencias injustificadas
  if (includeAbsenceDeductions && daysAbsent > 0) {
    // Calcular valor día: baseSalary / 22 días (aproximado)
    const dailyRate = baseSalary / 22;
    const absenceDeduction = daysAbsent * dailyRate * absenceDeductionRate;

    deductions.push({
      code: 'ABS',
      label: `Ausencias (${daysAbsent} día${daysAbsent > 1 ? 's' : ''})`,
      amount: Number(absenceDeduction.toFixed(2)),
    });
  }

  // 6. DEDUCCIÓN: Descuentos por tardanzas (si hay muchas)
  if (daysLate >= 3) {
    // Penalización: 0.5% del sueldo por cada 3 tardanzas
    const lateDeduction = baseSalary * 0.005 * Math.floor(daysLate / 3);
    deductions.push({
      code: 'LATE',
      label: `Tardanzas (${daysLate} día${daysLate > 1 ? 's' : ''})`,
      amount: Number(lateDeduction.toFixed(2)),
    });
  }

  // 7. DEDUCCIONES: Aportes obligatorios (Argentina)
  // Jubilación (11%)
  deductions.push({
    code: 'JUB',
    label: 'Jubilación (11%)',
    amount: Number((baseSalary * 0.11).toFixed(2)),
  });

  // Ley 19032 (3%)
  deductions.push({
    code: 'LEY19032',
    label: 'Ley 19032 (3%)',
    amount: Number((baseSalary * 0.03).toFixed(2)),
  });

  // Obra Social (3%)
  deductions.push({
    code: 'OS',
    label: 'Obra Social (3%)',
    amount: Number((baseSalary * 0.03).toFixed(2)),
  });

  // 8. DEDUCCIONES: Beneficios del empleado
  if (includeBenefitsDeductions) {
    const activeBenefits = await EmployeeBenefit.find({
      tenantId,
      employeeId,
      status: 'active',
      startDate: { $lte: endDate },
      $or: [
        { endDate: { $exists: false } }, // Sin fecha de fin
        { endDate: { $gte: startDate } }, // O termina después del período
      ],
    }).lean();

    activeBenefits.forEach((benefit: any) => {
      // Solo incluir si el beneficio tiene costo para el empleado y es mensual
      if (benefit.costToEmployee > 0 && benefit.frequency === 'monthly') {
        deductions.push({
          code: `BEN_${benefit.benefitType.toUpperCase()}`,
          label: `${benefit.benefitName} (Beneficio)`,
          amount: benefit.costToEmployee,
        });
      }
    });
  }

  // 9. Calcular totales
  const totalConcepts = concepts.reduce((sum, c) => sum + c.amount, 0);
  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);

  return {
    concepts,
    deductions,
    summary: {
      totalConcepts: Number(totalConcepts.toFixed(2)),
      totalDeductions: Number(totalDeductions.toFixed(2)),
      totalHoursWorked: Number(totalHoursWorked.toFixed(2)),
      totalOvertimeHours: Number(totalOvertimeHours.toFixed(2)),
      daysAbsent,
      daysLate,
    },
  };
}

/**
 * Genera un reporte de aportes patronales (lo que la empresa debe pagar por el empleado)
 */
export async function calculateEmployerContributions(
  tenantId: string,
  employeeId: string,
  period: string,
  baseSalary: number
): Promise<{
  contributions: Array<{ code: string; label: string; amount: number; percentage: number }>;
  total: number;
}> {
  const [year, month] = period.split('-').map(Number);
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const contributions = [];

  // Aportes patronales Argentina (porcentajes aproximados)
  contributions.push({
    code: 'CONT_JUB',
    label: 'Contribución Jubilación',
    percentage: 10.17,
    amount: Number((baseSalary * 0.1017).toFixed(2)),
  });

  contributions.push({
    code: 'CONT_OS',
    label: 'Contribución Obra Social',
    percentage: 6.0,
    amount: Number((baseSalary * 0.06).toFixed(2)),
  });

  contributions.push({
    code: 'CONT_PAMI',
    label: 'Contribución PAMI',
    percentage: 1.5,
    amount: Number((baseSalary * 0.015).toFixed(2)),
  });

  contributions.push({
    code: 'CONT_ART',
    label: 'ART (Riesgo de Trabajo)',
    percentage: 3.0,
    amount: Number((baseSalary * 0.03).toFixed(2)),
  });

  contributions.push({
    code: 'CONT_ASIG',
    label: 'Asignaciones Familiares',
    percentage: 4.44,
    amount: Number((baseSalary * 0.0444).toFixed(2)),
  });

  // Beneficios con costo patronal
  const activeBenefits = await EmployeeBenefit.find({
    tenantId,
    employeeId,
    status: 'active',
    startDate: { $lte: endDate },
    $or: [
      { endDate: { $exists: false } },
      { endDate: { $gte: startDate } },
    ],
  }).lean();

  activeBenefits.forEach((benefit: any) => {
    if (benefit.costToCompany > 0 && benefit.frequency === 'monthly') {
      contributions.push({
        code: `BCOST_${benefit.benefitType.toUpperCase()}`,
        label: `${benefit.benefitName} (Costo Empresa)`,
        percentage: 0,
        amount: benefit.costToCompany,
      });
    }
  });

  const total = contributions.reduce((sum, c) => sum + c.amount, 0);

  return {
    contributions,
    total: Number(total.toFixed(2)),
  };
}

/**
 * Calcula el costo total de un empleado para la empresa
 */
export async function calculateTotalEmployeeCost(
  tenantId: string,
  employeeId: string,
  period: string,
  baseSalary: number
): Promise<{
  baseSalary: number;
  concepts: number;
  employerContributions: number;
  totalCost: number;
  breakdown: any;
}> {
  // Calcular conceptos del empleado
  const autoCalc = await calculatePayrollConcepts(tenantId, employeeId, period, baseSalary);

  // Calcular aportes patronales
  const employer = await calculateEmployerContributions(tenantId, employeeId, period, baseSalary);

  const concepts = autoCalc.summary.totalConcepts;
  const employerContributions = employer.total;
  const totalCost = baseSalary + concepts + employerContributions;

  return {
    baseSalary,
    concepts,
    employerContributions,
    totalCost: Number(totalCost.toFixed(2)),
    breakdown: {
      payroll: {
        baseSalary,
        concepts: autoCalc.concepts,
        conceptsTotal: concepts,
        deductions: autoCalc.deductions,
        deductionsTotal: autoCalc.summary.totalDeductions,
        netPay: baseSalary + concepts - autoCalc.summary.totalDeductions,
      },
      employer: {
        contributions: employer.contributions,
        contributionsTotal: employerContributions,
      },
    },
  };
}
