import { Employee } from '../employee/employee.model.js';

/**
 * Reporte de demografía de empleados (distribución por dept, rol, antigüedad)
 */
export async function getEmployeeDemographics(params: {
  tenantId: string;
  status?: 'active' | 'inactive' | 'all';
}) {
  const { tenantId, status = 'active' } = params;

  const matchStage: any = { tenantId };
  if (status !== 'all') matchStage.status = status;

  // By Department
  const byDepartment = await Employee.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$department',
        count: { $sum: 1 },
        avgSalary: { $avg: { $ifNull: ['$salary', 0] } },
      },
    },
    { $sort: { count: -1 } },
  ]);

  // By Position
  const byPosition = await Employee.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$position',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  // By Employment Type
  const byEmploymentType = await Employee.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$employmentType',
        count: { $sum: 1 },
      },
    },
  ]);

  // By Contract Type
  const byContractType = await Employee.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$contractType',
        count: { $sum: 1 },
      },
    },
  ]);

  // By Gender
  const byGender = await Employee.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$gender',
        count: { $sum: 1 },
      },
    },
  ]);

  // By Seniority (years in company)
  const now = new Date();
  const employees = await Employee.find(matchStage).select('hireDate').lean();

  const bySeniority: any = {
    '0-1 years': 0,
    '1-3 years': 0,
    '3-5 years': 0,
    '5+ years': 0,
  };

  employees.forEach((emp: any) => {
    if (!emp.hireDate) return;
    const years =
      (now.getTime() - new Date(emp.hireDate).getTime()) /
      (1000 * 60 * 60 * 24 * 365);

    if (years < 1) bySeniority['0-1 years']++;
    else if (years < 3) bySeniority['1-3 years']++;
    else if (years < 5) bySeniority['3-5 years']++;
    else bySeniority['5+ years']++;
  });

  // Total count
  const totalEmployees = await Employee.countDocuments(matchStage);

  return {
    totalEmployees,
    byDepartment: byDepartment.map((d) => ({
      department: d._id || 'Sin departamento',
      count: d.count,
      avgSalary: Math.round(d.avgSalary),
      percentage: Math.round((d.count / totalEmployees) * 100 * 100) / 100,
    })),
    byPosition: byPosition.map((p) => ({
      position: p._id || 'Sin posición',
      count: p.count,
      percentage: Math.round((p.count / totalEmployees) * 100 * 100) / 100,
    })),
    byEmploymentType: byEmploymentType.map((et) => ({
      type: et._id || 'N/A',
      count: et.count,
      percentage: Math.round((et.count / totalEmployees) * 100 * 100) / 100,
    })),
    byContractType: byContractType.map((ct) => ({
      type: ct._id || 'N/A',
      count: ct.count,
      percentage: Math.round((ct.count / totalEmployees) * 100 * 100) / 100,
    })),
    byGender: byGender.map((g) => ({
      gender: g._id || 'No especificado',
      count: g.count,
      percentage: Math.round((g.count / totalEmployees) * 100 * 100) / 100,
    })),
    bySeniority: Object.entries(bySeniority).map(([range, count]: any) => ({
      range,
      count,
      percentage:
        Math.round((count / totalEmployees) * 100 * 100) / 100,
    })),
  };
}

/**
 * Reporte de rotación de personal (turnover)
 */
export async function getTurnoverReport(params: {
  tenantId: string;
  startDate: Date;
  endDate: Date;
}) {
  const { tenantId, startDate, endDate } = params;

  // Employees at start of period
  const employeesAtStart = await Employee.countDocuments({
    tenantId,
    hireDate: { $lt: startDate },
    $or: [
      { terminationDate: { $exists: false } },
      { terminationDate: { $gte: startDate } },
    ],
  });

  // New hires during period
  const newHires = await Employee.countDocuments({
    tenantId,
    hireDate: { $gte: startDate, $lte: endDate },
  });

  // Terminations during period
  const terminations = await Employee.countDocuments({
    tenantId,
    terminationDate: { $gte: startDate, $lte: endDate },
  });

  // Employees at end of period
  const employeesAtEnd = await Employee.countDocuments({
    tenantId,
    hireDate: { $lte: endDate },
    $or: [
      { terminationDate: { $exists: false } },
      { terminationDate: { $gt: endDate } },
    ],
  });

  // Average headcount
  const avgHeadcount = (employeesAtStart + employeesAtEnd) / 2;

  // Turnover rate (%)
  const turnoverRate = avgHeadcount > 0
    ? (terminations / avgHeadcount) * 100
    : 0;

  // Hire rate (%)
  const hireRate = avgHeadcount > 0
    ? (newHires / avgHeadcount) * 100
    : 0;

  // Get termination details
  const terminatedEmployees = await Employee.find({
    tenantId,
    terminationDate: { $gte: startDate, $lte: endDate },
  })
    .select('name department position terminationDate terminationReason')
    .lean();

  // Get new hire details
  const newHireEmployees = await Employee.find({
    tenantId,
    hireDate: { $gte: startDate, $lte: endDate },
  })
    .select('name department position hireDate')
    .lean();

  return {
    period: {
      start: startDate.toISOString().slice(0, 10),
      end: endDate.toISOString().slice(0, 10),
    },
    headcount: {
      atStart: employeesAtStart,
      atEnd: employeesAtEnd,
      average: Math.round(avgHeadcount),
    },
    newHires: {
      count: newHires,
      rate: Math.round(hireRate * 100) / 100,
      employees: newHireEmployees.map((e: any) => ({
        id: String(e._id),
        name: e.name,
        department: e.department,
        position: e.position,
        hireDate: e.hireDate,
      })),
    },
    terminations: {
      count: terminations,
      rate: Math.round(turnoverRate * 100) / 100,
      employees: terminatedEmployees.map((e: any) => ({
        id: String(e._id),
        name: e.name,
        department: e.department,
        position: e.position,
        terminationDate: e.terminationDate,
        reason: e.terminationReason,
      })),
    },
    netChange: newHires - terminations,
    growthRate: employeesAtStart > 0
      ? Math.round(((newHires - terminations) / employeesAtStart) * 100 * 100) / 100
      : 0,
  };
}

/**
 * Reporte de evolución de headcount (por mes)
 */
export async function getHeadcountTrend(params: {
  tenantId: string;
  startDate: Date;
  endDate: Date;
  groupBy: 'month' | 'quarter';
}) {
  const { tenantId, startDate, endDate, groupBy } = params;

  const results = [];

  let currentDate = new Date(startDate);
  currentDate.setDate(1); // Start of month

  while (currentDate <= endDate) {
    const periodEnd = new Date(currentDate);

    if (groupBy === 'month') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      // quarter
      periodEnd.setMonth(periodEnd.getMonth() + 3);
    }

    periodEnd.setDate(0); // End of previous month

    // Count active employees at end of period
    const headcount = await Employee.countDocuments({
      tenantId,
      hireDate: { $lte: periodEnd },
      $or: [
        { terminationDate: { $exists: false } },
        { terminationDate: { $gt: periodEnd } },
      ],
    });

    // Count new hires in period
    const newHires = await Employee.countDocuments({
      tenantId,
      hireDate: { $gte: currentDate, $lte: periodEnd },
    });

    // Count terminations in period
    const terminations = await Employee.countDocuments({
      tenantId,
      terminationDate: { $gte: currentDate, $lte: periodEnd },
    });

    results.push({
      period:
        groupBy === 'month'
          ? currentDate.toISOString().slice(0, 7) // YYYY-MM
          : `${currentDate.getFullYear()}-Q${Math.floor(currentDate.getMonth() / 3) + 1}`,
      headcount,
      newHires,
      terminations,
      netChange: newHires - terminations,
    });

    if (groupBy === 'month') {
      currentDate.setMonth(currentDate.getMonth() + 1);
    } else {
      currentDate.setMonth(currentDate.getMonth() + 3);
    }
  }

  return results;
}

/**
 * Reporte de distribución salarial
 */
export async function getSalaryDistribution(params: {
  tenantId: string;
  groupBy?: 'department' | 'position' | 'seniority';
}) {
  const { tenantId, groupBy = 'department' } = params;

  if (groupBy === 'department') {
    const results = await Employee.aggregate([
      { $match: { tenantId, status: 'active', salary: { $exists: true, $gt: 0 } } },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          avgSalary: { $avg: '$salary' },
          minSalary: { $min: '$salary' },
          maxSalary: { $max: '$salary' },
          totalSalary: { $sum: '$salary' },
        },
      },
      { $sort: { avgSalary: -1 } },
    ]);

    return results.map((r) => ({
      group: r._id || 'Sin departamento',
      count: r.count,
      avgSalary: Math.round(r.avgSalary),
      minSalary: Math.round(r.minSalary),
      maxSalary: Math.round(r.maxSalary),
      totalSalary: Math.round(r.totalSalary),
    }));
  }

  if (groupBy === 'position') {
    const results = await Employee.aggregate([
      { $match: { tenantId, status: 'active', salary: { $exists: true, $gt: 0 } } },
      {
        $group: {
          _id: '$position',
          count: { $sum: 1 },
          avgSalary: { $avg: '$salary' },
          minSalary: { $min: '$salary' },
          maxSalary: { $max: '$salary' },
        },
      },
      { $sort: { avgSalary: -1 } },
    ]);

    return results.map((r) => ({
      group: r._id || 'Sin posición',
      count: r.count,
      avgSalary: Math.round(r.avgSalary),
      minSalary: Math.round(r.minSalary),
      maxSalary: Math.round(r.maxSalary),
    }));
  }

  // groupBy === 'seniority'
  const employees = await Employee.find({
    tenantId,
    status: 'active',
    salary: { $exists: true, $gt: 0 },
  })
    .select('hireDate salary')
    .lean();

  const now = new Date();
  const bySeniority: any = {
    '0-1 years': { count: 0, salaries: [] },
    '1-3 years': { count: 0, salaries: [] },
    '3-5 years': { count: 0, salaries: [] },
    '5+ years': { count: 0, salaries: [] },
  };

  employees.forEach((emp: any) => {
    if (!emp.hireDate) return;
    const years =
      (now.getTime() - new Date(emp.hireDate).getTime()) /
      (1000 * 60 * 60 * 24 * 365);

    let bucket = '';
    if (years < 1) bucket = '0-1 years';
    else if (years < 3) bucket = '1-3 years';
    else if (years < 5) bucket = '3-5 years';
    else bucket = '5+ years';

    bySeniority[bucket].count++;
    bySeniority[bucket].salaries.push(emp.salary);
  });

  return Object.entries(bySeniority).map(([range, data]: any) => ({
    group: range,
    count: data.count,
    avgSalary:
      data.salaries.length > 0
        ? Math.round(
            data.salaries.reduce((a: number, b: number) => a + b, 0) /
              data.salaries.length
          )
        : 0,
    minSalary: data.salaries.length > 0 ? Math.min(...data.salaries) : 0,
    maxSalary: data.salaries.length > 0 ? Math.max(...data.salaries) : 0,
  }));
}

/**
 * Reporte de próximos cumpleaños
 */
export async function getUpcomingBirthdays(params: {
  tenantId: string;
  days: number; // Próximos N días
}) {
  const { tenantId, days } = params;

  const now = new Date();
  const employees = await Employee.find({
    tenantId,
    status: 'active',
    dateOfBirth: { $exists: true },
  })
    .select('name email dateOfBirth department')
    .lean();

  const upcoming = [];

  for (const emp of employees) {
    if (!emp.dateOfBirth) continue;

    const dob = new Date(emp.dateOfBirth);
    const thisYear = now.getFullYear();

    // Birthday this year
    const birthdayThisYear = new Date(thisYear, dob.getMonth(), dob.getDate());

    // If already passed, check next year
    if (birthdayThisYear < now) {
      birthdayThisYear.setFullYear(thisYear + 1);
    }

    const daysUntil = Math.floor(
      (birthdayThisYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntil >= 0 && daysUntil <= days) {
      upcoming.push({
        employeeId: String(emp._id),
        name: emp.name,
        email: emp.email,
        department: emp.department,
        dateOfBirth: emp.dateOfBirth,
        birthdayDate: birthdayThisYear,
        daysUntil,
      });
    }
  }

  return upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
}
