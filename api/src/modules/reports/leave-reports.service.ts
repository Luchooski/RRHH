import { Leave } from '../leave/leave.model.js';
import { Employee } from '../employee/employee.model.js';

/**
 * Reporte de balance de licencias por empleado
 */
export async function getLeaveBalanceReport(params: {
  tenantId: string;
  employeeId?: string;
  department?: string;
}) {
  const { tenantId, employeeId, department } = params;

  // Get all employees
  const filter: any = { tenantId, status: 'active' };
  if (employeeId) filter._id = employeeId;
  if (department) filter.department = department;

  const employees = await Employee.find(filter).lean();

  const results = [];

  for (const employee of employees) {
    const empId = String(employee._id);

    // Get leave usage by type
    const usageByType = await Leave.aggregate([
      {
        $match: {
          tenantId,
          employeeId: empId,
          status: { $in: ['approved', 'pending'] },
        },
      },
      {
        $group: {
          _id: '$leaveType',
          totalDays: {
            $sum: {
              $divide: [
                { $subtract: ['$endDate', '$startDate'] },
                1000 * 60 * 60 * 24,
              ],
            },
          },
          approved: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'approved'] },
                {
                  $divide: [
                    { $subtract: ['$endDate', '$startDate'] },
                    1000 * 60 * 60 * 24,
                  ],
                },
                0,
              ],
            },
          },
          pending: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'pending'] },
                {
                  $divide: [
                    { $subtract: ['$endDate', '$startDate'] },
                    1000 * 60 * 60 * 24,
                  ],
                },
                0,
              ],
            },
          },
        },
      },
    ]);

    // Default balances (customize based on your business rules)
    const defaultBalances: any = {
      vacation: 14, // 14 days per year
      sick: 10,
      personal: 5,
      unpaid: 0,
      maternity: 90,
      paternity: 15,
    };

    const balances: any = {};

    Object.keys(defaultBalances).forEach((type) => {
      const usage = usageByType.find((u) => u._id === type);
      const used = usage ? Math.ceil(usage.approved) : 0;
      const pending = usage ? Math.ceil(usage.pending) : 0;

      balances[type] = {
        total: defaultBalances[type],
        used,
        pending,
        available: Math.max(0, defaultBalances[type] - used - pending),
      };
    });

    results.push({
      employeeId: empId,
      employeeName: employee.name,
      department: employee.department || 'N/A',
      balances,
      totalAvailable: Object.values(balances).reduce(
        (sum: number, b: any) => sum + b.available,
        0
      ),
      totalUsed: Object.values(balances).reduce(
        (sum: number, b: any) => sum + b.used,
        0
      ),
    });
  }

  return results;
}

/**
 * Reporte de uso de licencias por período
 */
export async function getLeaveUsageReport(params: {
  tenantId: string;
  startDate: Date;
  endDate: Date;
  employeeId?: string;
  leaveType?: string;
}) {
  const { tenantId, startDate, endDate, employeeId, leaveType } = params;

  const matchStage: any = {
    tenantId,
    status: { $in: ['approved', 'rejected', 'pending'] },
    $or: [
      { startDate: { $gte: startDate, $lte: endDate } },
      { endDate: { $gte: startDate, $lte: endDate } },
      {
        $and: [{ startDate: { $lte: startDate } }, { endDate: { $gte: endDate } }],
      },
    ],
  };

  if (employeeId) matchStage.employeeId = employeeId;
  if (leaveType) matchStage.leaveType = leaveType;

  const pipeline: any[] = [
    { $match: matchStage },
    {
      $addFields: {
        days: {
          $divide: [
            { $subtract: ['$endDate', '$startDate'] },
            1000 * 60 * 60 * 24,
          ],
        },
      },
    },
    {
      $group: {
        _id: {
          employeeId: '$employeeId',
          leaveType: '$leaveType',
          status: '$status',
        },
        employeeName: { $first: '$employeeName' },
        totalDays: { $sum: '$days' },
        count: { $sum: 1 },
        leaves: {
          $push: {
            id: '$_id',
            startDate: '$startDate',
            endDate: '$endDate',
            days: '$days',
            reason: '$reason',
            status: '$status',
          },
        },
      },
    },
    {
      $group: {
        _id: '$_id.employeeId',
        employeeName: { $first: '$employeeName' },
        byType: {
          $push: {
            leaveType: '$_id.leaveType',
            status: '$_id.status',
            totalDays: '$totalDays',
            count: '$count',
            leaves: '$leaves',
          },
        },
        totalDaysAllTypes: { $sum: '$totalDays' },
        totalCount: { $sum: '$count' },
      },
    },
    { $sort: { totalDaysAllTypes: -1 } },
  ];

  const results = await Leave.aggregate(pipeline);

  return results.map((r) => ({
    employeeId: r._id,
    employeeName: r.employeeName,
    totalDays: Math.ceil(r.totalDaysAllTypes),
    totalCount: r.totalCount,
    byType: r.byType.map((t: any) => ({
      leaveType: t.leaveType,
      status: t.status,
      totalDays: Math.ceil(t.totalDays),
      count: t.count,
      leaves: t.leaves,
    })),
  }));
}

/**
 * Reporte de proyecciones de acumulación (para el módulo de Time Off Balance)
 */
export async function getLeaveProjections(params: {
  tenantId: string;
  employeeId: string;
  months: number; // Proyectar N meses hacia adelante
}) {
  const { tenantId, employeeId, months } = params;

  const employee = await Employee.findOne({ _id: employeeId, tenantId }).lean();
  if (!employee) throw new Error('Employee not found');

  // Get current usage
  const currentUsage = await Leave.aggregate([
    {
      $match: {
        tenantId,
        employeeId,
        status: 'approved',
      },
    },
    {
      $group: {
        _id: '$leaveType',
        totalDays: {
          $sum: {
            $divide: [
              { $subtract: ['$endDate', '$startDate'] },
              1000 * 60 * 60 * 24,
            ],
          },
        },
      },
    },
  ]);

  // Accrual rates per month (customize based on your business rules)
  const accrualRates: any = {
    vacation: 14 / 12, // 14 days per year = ~1.17 per month
    sick: 10 / 12,
    personal: 5 / 12,
  };

  const projections = [];
  const now = new Date();

  for (let i = 0; i <= months; i++) {
    const date = new Date(now);
    date.setMonth(date.getMonth() + i);

    const balances: any = {};

    Object.keys(accrualRates).forEach((type) => {
      const rate = accrualRates[type];
      const used =
        currentUsage.find((u) => u._id === type)?.totalDays || 0;
      const accrued = rate * i;
      const available = Math.max(0, accrued - used);

      balances[type] = {
        accrued: Math.round(accrued * 100) / 100,
        used: Math.ceil(used),
        available: Math.round(available * 100) / 100,
      };
    });

    projections.push({
      month: date.toISOString().slice(0, 7), // YYYY-MM
      balances,
    });
  }

  return {
    employeeId,
    employeeName: employee.name,
    projections,
  };
}

/**
 * Reporte estadístico de licencias (tendencias)
 */
export async function getLeaveStatistics(params: {
  tenantId: string;
  startDate: Date;
  endDate: Date;
  groupBy: 'type' | 'month' | 'department';
}) {
  const { tenantId, startDate, endDate, groupBy } = params;

  if (groupBy === 'type') {
    const pipeline: any[] = [
      {
        $match: {
          tenantId,
          status: 'approved',
          startDate: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $addFields: {
          days: {
            $divide: [
              { $subtract: ['$endDate', '$startDate'] },
              1000 * 60 * 60 * 24,
            ],
          },
        },
      },
      {
        $group: {
          _id: '$leaveType',
          totalDays: { $sum: '$days' },
          count: { $sum: 1 },
          avgDays: { $avg: '$days' },
        },
      },
      { $sort: { totalDays: -1 } },
    ];

    const results = await Leave.aggregate(pipeline);
    return results.map((r) => ({
      type: r._id,
      totalDays: Math.ceil(r.totalDays),
      count: r.count,
      avgDays: Math.round(r.avgDays * 100) / 100,
    }));
  }

  if (groupBy === 'month') {
    const pipeline: any[] = [
      {
        $match: {
          tenantId,
          status: 'approved',
          startDate: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $addFields: {
          month: { $month: '$startDate' },
          year: { $year: '$startDate' },
          days: {
            $divide: [
              { $subtract: ['$endDate', '$startDate'] },
              1000 * 60 * 60 * 24,
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            year: '$year',
            month: '$month',
          },
          totalDays: { $sum: '$days' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $addFields: {
          period: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: {
                  if: { $lt: ['$_id.month', 10] },
                  then: { $concat: ['0', { $toString: '$_id.month' }] },
                  else: { $toString: '$_id.month' },
                },
              },
            ],
          },
        },
      },
    ];

    const results = await Leave.aggregate(pipeline);
    return results.map((r) => ({
      period: r.period,
      totalDays: Math.ceil(r.totalDays),
      count: r.count,
    }));
  }

  // groupBy === 'department'
  // This requires joining with Employee
  const leaves = await Leave.find({
    tenantId,
    status: 'approved',
    startDate: { $gte: startDate, $lte: endDate },
  }).lean();

  const employeeIds = [...new Set(leaves.map((l: any) => l.employeeId))];
  const employees = await Employee.find({
    _id: { $in: employeeIds },
    tenantId,
  })
    .select('_id department')
    .lean();

  const empDeptMap = new Map(
    employees.map((e: any) => [String(e._id), e.department || 'N/A'])
  );

  const byDept: any = {};

  leaves.forEach((leave: any) => {
    const dept = empDeptMap.get(leave.employeeId) || 'N/A';
    const days =
      (new Date(leave.endDate).getTime() -
        new Date(leave.startDate).getTime()) /
      (1000 * 60 * 60 * 24);

    if (!byDept[dept]) {
      byDept[dept] = { department: dept, totalDays: 0, count: 0 };
    }

    byDept[dept].totalDays += days;
    byDept[dept].count++;
  });

  return Object.values(byDept).map((d: any) => ({
    department: d.department,
    totalDays: Math.ceil(d.totalDays),
    count: d.count,
  }));
}
