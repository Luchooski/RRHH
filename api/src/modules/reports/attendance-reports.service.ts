import { Attendance } from '../attendance/attendance.model.js';
import { Employee } from '../employee/employee.model.js';

/**
 * Reporte de resumen de asistencia por período
 */
export async function getAttendanceSummaryReport(params: {
  tenantId: string;
  startDate: Date;
  endDate: Date;
  employeeId?: string;
  department?: string;
}) {
  const { tenantId, startDate, endDate, employeeId, department } = params;

  const matchStage: any = {
    tenantId,
    date: { $gte: startDate, $lte: endDate },
  };

  if (employeeId) {
    matchStage.employeeId = employeeId;
  }

  const pipeline: any[] = [
    { $match: matchStage },
    {
      $group: {
        _id: '$employeeId',
        employeeName: { $first: '$employeeName' },
        totalDays: { $sum: 1 },
        totalHours: { $sum: { $ifNull: ['$hoursWorked', 0] } },
        totalRegularHours: { $sum: { $ifNull: ['$regularHours', 0] } },
        totalOvertimeHours: { $sum: { $ifNull: ['$overtimeHours', 0] } },
        daysPresent: {
          $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] },
        },
        daysAbsent: {
          $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] },
        },
        daysLate: {
          $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] },
        },
        daysHalfDay: {
          $sum: { $cond: [{ $eq: ['$status', 'half_day'] }, 1, 0] },
        },
        daysLeave: {
          $sum: { $cond: [{ $eq: ['$status', 'leave'] }, 1, 0] },
        },
        daysHoliday: {
          $sum: { $cond: [{ $eq: ['$status', 'holiday'] }, 1, 0] },
        },
      },
    },
    {
      $addFields: {
        averageHoursPerDay: {
          $cond: {
            if: { $gt: ['$totalDays', 0] },
            then: { $divide: ['$totalHours', '$totalDays'] },
            else: 0,
          },
        },
        attendanceRate: {
          $cond: {
            if: { $gt: ['$totalDays', 0] },
            then: {
              $multiply: [{ $divide: ['$daysPresent', '$totalDays'] }, 100],
            },
            else: 0,
          },
        },
      },
    },
    { $sort: { totalHours: -1 } },
  ];

  const results = await Attendance.aggregate(pipeline);

  // If department filter is provided, join with Employee to filter
  if (department) {
    const employeeIds = results.map((r) => r._id);
    const employees = await Employee.find({
      _id: { $in: employeeIds },
      tenantId,
      department,
    })
      .select('_id')
      .lean();

    const filteredIds = new Set(employees.map((e) => String(e._id)));
    return results.filter((r) => filteredIds.has(String(r._id)));
  }

  return results;
}

/**
 * Reporte de horas extra por período
 */
export async function getOvertimeReport(params: {
  tenantId: string;
  startDate: Date;
  endDate: Date;
  employeeId?: string;
  minOvertimeHours?: number;
}) {
  const { tenantId, startDate, endDate, employeeId, minOvertimeHours = 0 } = params;

  const matchStage: any = {
    tenantId,
    date: { $gte: startDate, $lte: endDate },
    overtimeHours: { $gt: minOvertimeHours },
  };

  if (employeeId) {
    matchStage.employeeId = employeeId;
  }

  const pipeline: any[] = [
    { $match: matchStage },
    {
      $group: {
        _id: '$employeeId',
        employeeName: { $first: '$employeeName' },
        totalOvertimeHours: { $sum: '$overtimeHours' },
        overtimeDays: { $sum: 1 },
        avgOvertimePerDay: { $avg: '$overtimeHours' },
        maxOvertimeInDay: { $max: '$overtimeHours' },
        overtimeByDate: {
          $push: {
            date: '$date',
            hours: '$overtimeHours',
          },
        },
      },
    },
    { $sort: { totalOvertimeHours: -1 } },
  ];

  const results = await Attendance.aggregate(pipeline);

  return results;
}

/**
 * Reporte de ausencias por período
 */
export async function getAbsencesReport(params: {
  tenantId: string;
  startDate: Date;
  endDate: Date;
  employeeId?: string;
  includeLeaves?: boolean;
}) {
  const { tenantId, startDate, endDate, employeeId, includeLeaves = false } = params;

  const statuses = includeLeaves ? ['absent', 'leave'] : ['absent'];

  const matchStage: any = {
    tenantId,
    date: { $gte: startDate, $lte: endDate },
    status: { $in: statuses },
  };

  if (employeeId) {
    matchStage.employeeId = employeeId;
  }

  const pipeline: any[] = [
    { $match: matchStage },
    {
      $group: {
        _id: {
          employeeId: '$employeeId',
          status: '$status',
        },
        employeeName: { $first: '$employeeName' },
        count: { $sum: 1 },
        dates: { $push: '$date' },
      },
    },
    {
      $group: {
        _id: '$_id.employeeId',
        employeeName: { $first: '$employeeName' },
        totalAbsences: { $sum: '$count' },
        byStatus: {
          $push: {
            status: '$_id.status',
            count: '$count',
            dates: '$dates',
          },
        },
      },
    },
    { $sort: { totalAbsences: -1 } },
  ];

  const results = await Attendance.aggregate(pipeline);

  return results;
}

/**
 * Reporte de tendencia de asistencia (por semana o mes)
 */
export async function getAttendanceTrend(params: {
  tenantId: string;
  startDate: Date;
  endDate: Date;
  groupBy: 'week' | 'month';
}) {
  const { tenantId, startDate, endDate, groupBy } = params;

  const pipeline: any[] = [
    {
      $match: {
        tenantId,
        date: { $gte: startDate, $lte: endDate },
      },
    },
  ];

  if (groupBy === 'week') {
    pipeline.push({
      $addFields: {
        isoWeek: { $isoWeek: '$date' },
        isoYear: { $isoWeekYear: '$date' },
      },
    });
    pipeline.push({
      $group: {
        _id: {
          year: '$isoYear',
          week: '$isoWeek',
        },
        totalDays: { $sum: 1 },
        totalHours: { $sum: { $ifNull: ['$hoursWorked', 0] } },
        totalOvertimeHours: { $sum: { $ifNull: ['$overtimeHours', 0] } },
        daysPresent: {
          $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] },
        },
        daysAbsent: {
          $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] },
        },
        uniqueEmployees: { $addToSet: '$employeeId' },
      },
    });
    pipeline.push({
      $addFields: {
        period: {
          $concat: [
            { $toString: '$_id.year' },
            '-W',
            { $toString: '$_id.week' },
          ],
        },
        avgHoursPerEmployee: {
          $cond: {
            if: { $gt: [{ $size: '$uniqueEmployees' }, 0] },
            then: {
              $divide: ['$totalHours', { $size: '$uniqueEmployees' }],
            },
            else: 0,
          },
        },
      },
    });
    pipeline.push({ $sort: { '_id.year': 1, '_id.week': 1 } });
  } else {
    // groupBy === 'month'
    pipeline.push({
      $addFields: {
        month: { $month: '$date' },
        year: { $year: '$date' },
      },
    });
    pipeline.push({
      $group: {
        _id: {
          year: '$year',
          month: '$month',
        },
        totalDays: { $sum: 1 },
        totalHours: { $sum: { $ifNull: ['$hoursWorked', 0] } },
        totalOvertimeHours: { $sum: { $ifNull: ['$overtimeHours', 0] } },
        daysPresent: {
          $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] },
        },
        daysAbsent: {
          $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] },
        },
        uniqueEmployees: { $addToSet: '$employeeId' },
      },
    });
    pipeline.push({
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
        avgHoursPerEmployee: {
          $cond: {
            if: { $gt: [{ $size: '$uniqueEmployees' }, 0] },
            then: {
              $divide: ['$totalHours', { $size: '$uniqueEmployees' }],
            },
            else: 0,
          },
        },
      },
    });
    pipeline.push({ $sort: { '_id.year': 1, '_id.month': 1 } });
  }

  const results = await Attendance.aggregate(pipeline);

  return results.map((r) => ({
    period: r.period,
    totalDays: r.totalDays,
    totalHours: Math.round(r.totalHours * 100) / 100,
    totalOvertimeHours: Math.round(r.totalOvertimeHours * 100) / 100,
    daysPresent: r.daysPresent,
    daysAbsent: r.daysAbsent,
    avgHoursPerEmployee: Math.round(r.avgHoursPerEmployee * 100) / 100,
    uniqueEmployees: r.uniqueEmployees.length,
  }));
}
