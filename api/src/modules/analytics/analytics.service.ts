import { Candidate } from '../candidates/candidate.model.js';
import { Vacancy } from '../vacancy/vacancy.model.js';
import { Application } from '../application/application.model.js';
import { Employee } from '../employee/employee.model.js';
import { Attendance } from '../attendance/attendance.model.js';
import { Leave } from '../leave/leave.model.js';
import { EmployeeBenefit } from '../benefits/benefits.model.js';

// ===== Dashboard KPIs =====

export interface DashboardKPIs {
  recruitment: {
    totalCandidates: number;
    activeVacancies: number;
    applicationsThisMonth: number;
    avgTimeToHire: number; // días
    candidatesByStage: Record<string, number>;
  };
  employees: {
    totalActive: number;
    newHiresThisMonth: number;
    newHiresThisYear: number;
    byDepartment: Array<{ department: string; count: number }>;
    byPosition: Array<{ position: string; count: number }>;
  };
  attendance: {
    avgAttendanceRate: number; // porcentaje
    totalHoursThisMonth: number;
    lateArrivalsThisMonth: number;
    absentThisMonth: number;
  };
  leaves: {
    pendingApproval: number;
    approvedThisMonth: number;
    rejectedThisMonth: number;
    byType: Record<string, number>;
  };
  benefits: {
    totalMonthlyCost: number;
    activeAssignments: number;
    byType: Record<string, number>;
  };
}

/**
 * Obtener KPIs del dashboard
 */
export async function getDashboardKPIs(tenantId: string): Promise<DashboardKPIs> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // Ejecutar queries en paralelo para mejor performance
  const [
    recruitment,
    employees,
    attendance,
    leaves,
    benefits,
  ] = await Promise.all([
    getRecruitmentMetrics(tenantId, startOfMonth),
    getEmployeeMetrics(tenantId, startOfMonth, startOfYear),
    getAttendanceMetrics(tenantId, startOfMonth, now),
    getLeaveMetrics(tenantId, startOfMonth),
    getBenefitsMetrics(tenantId),
  ]);

  return {
    recruitment,
    employees,
    attendance,
    leaves,
    benefits,
  };
}

// ===== Recruitment Metrics =====

async function getRecruitmentMetrics(tenantId: string, startOfMonth: Date) {
  const [
    totalCandidates,
    activeVacancies,
    applicationsThisMonth,
    candidatesByStage,
  ] = await Promise.all([
    Candidate.countDocuments({ tenantId }),
    Vacancy.countDocuments({ tenantId, status: 'open' }),
    Application.countDocuments({
      tenantId,
      createdAt: { $gte: startOfMonth },
    }),
    Application.aggregate([
      { $match: { tenantId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  const stageMap: Record<string, number> = {};
  candidatesByStage.forEach((item: any) => {
    stageMap[item._id] = item.count;
  });

  // Calcular tiempo promedio de contratación (simplificado)
  const avgTimeToHire = 15; // Placeholder - requiere lógica más compleja

  return {
    totalCandidates,
    activeVacancies,
    applicationsThisMonth,
    avgTimeToHire,
    candidatesByStage: stageMap,
  };
}

// ===== Employee Metrics =====

async function getEmployeeMetrics(
  tenantId: string,
  startOfMonth: Date,
  startOfYear: Date
) {
  const [
    totalActive,
    newHiresThisMonth,
    newHiresThisYear,
    byDepartment,
    byPosition,
  ] = await Promise.all([
    Employee.countDocuments({ tenantId, status: 'active' }),
    Employee.countDocuments({
      tenantId,
      status: 'active',
      hireDate: { $gte: startOfMonth },
    }),
    Employee.countDocuments({
      tenantId,
      status: 'active',
      hireDate: { $gte: startOfYear },
    }),
    Employee.aggregate([
      { $match: { tenantId, status: 'active' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Employee.aggregate([
      { $match: { tenantId, status: 'active' } },
      { $group: { _id: '$position', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  return {
    totalActive,
    newHiresThisMonth,
    newHiresThisYear,
    byDepartment: byDepartment.map((d: any) => ({
      department: d._id || 'Sin departamento',
      count: d.count,
    })),
    byPosition: byPosition.map((p: any) => ({
      position: p._id || 'Sin posición',
      count: p.count,
    })),
  };
}

// ===== Attendance Metrics =====

async function getAttendanceMetrics(
  tenantId: string,
  startOfMonth: Date,
  endOfMonth: Date
) {
  const attendances = await Attendance.find({
    tenantId,
    date: { $gte: startOfMonth, $lte: endOfMonth },
  }).lean();

  const totalDays = attendances.length;
  const present = attendances.filter((a: any) => a.status === 'present' || a.status === 'late').length;
  const lateArrivals = attendances.filter((a: any) => a.status === 'late').length;
  const absent = attendances.filter((a: any) => a.status === 'absent').length;

  const totalHours = attendances.reduce((sum: number, a: any) => sum + (a.hoursWorked || 0), 0);

  const avgAttendanceRate = totalDays > 0 ? (present / totalDays) * 100 : 0;

  return {
    avgAttendanceRate: Number(avgAttendanceRate.toFixed(2)),
    totalHoursThisMonth: Number(totalHours.toFixed(2)),
    lateArrivalsThisMonth: lateArrivals,
    absentThisMonth: absent,
  };
}

// ===== Leave Metrics =====

async function getLeaveMetrics(tenantId: string, startOfMonth: Date) {
  const [
    pendingApproval,
    approvedThisMonth,
    rejectedThisMonth,
    byType,
  ] = await Promise.all([
    Leave.countDocuments({ tenantId, status: 'pending' }),
    Leave.countDocuments({
      tenantId,
      status: 'approved',
      updatedAt: { $gte: startOfMonth },
    }),
    Leave.countDocuments({
      tenantId,
      status: 'rejected',
      updatedAt: { $gte: startOfMonth },
    }),
    Leave.aggregate([
      { $match: { tenantId, status: { $in: ['approved', 'pending'] } } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]),
  ]);

  const typeMap: Record<string, number> = {};
  byType.forEach((item: any) => {
    typeMap[item._id] = item.count;
  });

  return {
    pendingApproval,
    approvedThisMonth,
    rejectedThisMonth,
    byType: typeMap,
  };
}

// ===== Benefits Metrics =====

async function getBenefitsMetrics(tenantId: string) {
  const activeBenefits = await EmployeeBenefit.find({
    tenantId,
    status: 'active',
  }).lean();

  let totalMonthlyCost = 0;
  const byType: Record<string, number> = {};

  activeBenefits.forEach((benefit: any) => {
    // Normalizar a costo mensual
    let monthlyCost = benefit.costToCompany;
    if (benefit.frequency === 'yearly') {
      monthlyCost /= 12;
    } else if (benefit.frequency === 'quarterly') {
      monthlyCost /= 3;
    }

    totalMonthlyCost += monthlyCost;

    if (!byType[benefit.benefitType]) {
      byType[benefit.benefitType] = 0;
    }
    byType[benefit.benefitType]++;
  });

  return {
    totalMonthlyCost: Number(totalMonthlyCost.toFixed(2)),
    activeAssignments: activeBenefits.length,
    byType,
  };
}

// ===== Time Series Data =====

export interface TimeSeriesData {
  date: string;
  value: number;
}

/**
 * Obtener serie temporal de nuevas contrataciones
 */
export async function getNewHiresTrend(
  tenantId: string,
  months: number = 6
): Promise<TimeSeriesData[]> {
  const result: TimeSeriesData[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

    const count = await Employee.countDocuments({
      tenantId,
      hireDate: { $gte: date, $lt: nextDate },
    });

    result.push({
      date: date.toISOString().slice(0, 7), // YYYY-MM
      value: count,
    });
  }

  return result;
}

/**
 * Obtener serie temporal de aplicaciones
 */
export async function getApplicationsTrend(
  tenantId: string,
  months: number = 6
): Promise<TimeSeriesData[]> {
  const result: TimeSeriesData[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

    const count = await Application.countDocuments({
      tenantId,
      createdAt: { $gte: date, $lt: nextDate },
    });

    result.push({
      date: date.toISOString().slice(0, 7),
      value: count,
    });
  }

  return result;
}

/**
 * Obtener serie temporal de asistencia
 */
export async function getAttendanceTrend(
  tenantId: string,
  days: number = 30
): Promise<TimeSeriesData[]> {
  const result: TimeSeriesData[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const attendances = await Attendance.find({
      tenantId,
      date: { $gte: date, $lt: nextDate },
    }).lean();

    const total = attendances.length;
    const present = attendances.filter(
      (a: any) => a.status === 'present' || a.status === 'late'
    ).length;

    const rate = total > 0 ? (present / total) * 100 : 0;

    result.push({
      date: date.toISOString().slice(0, 10), // YYYY-MM-DD
      value: Number(rate.toFixed(2)),
    });
  }

  return result;
}
