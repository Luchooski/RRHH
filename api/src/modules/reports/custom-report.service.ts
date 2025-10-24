import { CustomReport, ICustomReport } from './custom-report.model.js';
import * as AttendanceReports from './attendance-reports.service.js';
import * as LeaveReports from './leave-reports.service.js';
import * as EmployeeReports from './employee-reports.service.js';

/**
 * Create a new custom report
 */
export async function createCustomReport(params: {
  tenantId: string;
  userId: string;
  userName: string;
  name: string;
  description?: string;
  reportType: 'attendance' | 'leaves' | 'employees' | 'payroll';
  fields: string[];
  filters: any;
  sortBy?: { field: string; order: 'asc' | 'desc' };
  isPublic?: boolean;
}) {
  const customReport = new CustomReport({
    tenantId: params.tenantId,
    userId: params.userId,
    userName: params.userName,
    name: params.name,
    description: params.description,
    reportType: params.reportType,
    fields: params.fields,
    filters: params.filters,
    sortBy: params.sortBy,
    isPublic: params.isPublic || false,
  });

  await customReport.save();
  return customReport;
}

/**
 * List custom reports for a tenant/user
 */
export async function listCustomReports(params: {
  tenantId: string;
  userId: string;
  reportType?: string;
  includePublic?: boolean;
}) {
  const { tenantId, userId, reportType, includePublic = true } = params;

  const query: any = { tenantId };

  if (reportType) {
    query.reportType = reportType;
  }

  // Show reports created by user OR public reports
  if (includePublic) {
    query.$or = [{ userId }, { isPublic: true }];
  } else {
    query.userId = userId;
  }

  const reports = await CustomReport.find(query)
    .sort({ createdAt: -1 })
    .lean();

  return reports;
}

/**
 * Get custom report by ID
 */
export async function getCustomReportById(params: {
  tenantId: string;
  reportId: string;
  userId: string;
}): Promise<any> {
  const { tenantId, reportId, userId } = params;

  const report = await CustomReport.findOne({
    _id: reportId,
    tenantId,
    $or: [{ userId }, { isPublic: true }],
  }).lean();

  if (!report) {
    throw new Error('Report not found or access denied');
  }

  return report;
}

/**
 * Update custom report
 */
export async function updateCustomReport(params: {
  tenantId: string;
  reportId: string;
  userId: string;
  updates: Partial<ICustomReport>;
}) {
  const { tenantId, reportId, userId, updates } = params;

  const report = await CustomReport.findOneAndUpdate(
    { _id: reportId, tenantId, userId }, // Only owner can update
    { $set: updates },
    { new: true }
  );

  if (!report) {
    throw new Error('Report not found or access denied');
  }

  return report;
}

/**
 * Delete custom report
 */
export async function deleteCustomReport(params: {
  tenantId: string;
  reportId: string;
  userId: string;
}) {
  const { tenantId, reportId, userId } = params;

  const result = await CustomReport.deleteOne({
    _id: reportId,
    tenantId,
    userId, // Only owner can delete
  });

  if (result.deletedCount === 0) {
    throw new Error('Report not found or access denied');
  }

  return { success: true };
}

/**
 * Execute a custom report
 */
export async function executeCustomReport(params: {
  tenantId: string;
  reportId: string;
  userId: string;
}) {
  const { tenantId, reportId, userId } = params;

  const report = await getCustomReportById({ tenantId, reportId, userId });

  // Execute based on report type
  let data: any;

  if (report.reportType === 'attendance') {
    const { dateRange, employeeId, department } = report.filters;

    if (!dateRange?.from || !dateRange?.to) {
      throw new Error('Date range required for attendance reports');
    }

    data = await AttendanceReports.getAttendanceSummaryReport({
      tenantId,
      startDate: new Date(dateRange.from),
      endDate: new Date(dateRange.to),
      employeeId,
      department,
    });
  } else if (report.reportType === 'leaves') {
    const { employeeId, department } = report.filters;

    data = await LeaveReports.getLeaveBalanceReport({
      tenantId,
      employeeId,
      department,
    });
  } else if (report.reportType === 'employees') {
    const { status = 'active' } = report.filters;

    data = await EmployeeReports.getEmployeeDemographics({
      tenantId,
      status,
    });
  } else {
    throw new Error(`Report type ${report.reportType} not yet implemented`);
  }

  // Apply field filtering
  if (report.fields && report.fields.length > 0) {
    data = filterFields(data, report.fields);
  }

  // Apply sorting
  if (report.sortBy && Array.isArray(data)) {
    data = sortData(data, report.sortBy.field, report.sortBy.order);
  }

  return {
    report,
    data,
    executedAt: new Date(),
  };
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(params: {
  tenantId: string;
  reportId: string;
  userId: string;
}) {
  const { tenantId, reportId, userId } = params;

  const report = await CustomReport.findOne({
    _id: reportId,
    tenantId,
    userId,
  });

  if (!report) {
    throw new Error('Report not found or access denied');
  }

  (report as any).isFavorite = !(report as any).isFavorite;
  await report.save();

  return report;
}

// Helper: Filter fields from data
function filterFields(data: any, fields: string[]): any {
  if (Array.isArray(data)) {
    return data.map((item) => {
      const filtered: any = {};
      fields.forEach((field) => {
        if (item[field] !== undefined) {
          filtered[field] = item[field];
        }
      });
      return filtered;
    });
  } else if (typeof data === 'object' && data !== null) {
    const filtered: any = {};
    fields.forEach((field) => {
      if (data[field] !== undefined) {
        filtered[field] = data[field];
      }
    });
    return filtered;
  }
  return data;
}

// Helper: Sort data
function sortData(data: any[], field: string, order: 'asc' | 'desc'): any[] {
  return [...data].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];

    if (aVal === undefined || bVal === undefined) return 0;

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return order === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return order === 'asc' ? aVal - bVal : bVal - aVal;
    }

    return 0;
  });
}
