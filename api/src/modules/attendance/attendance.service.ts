import { Attendance, IAttendance } from './attendance.model.js';
import { Employee } from '../employee/employee.model.js';

export interface CheckInInput {
  employeeId: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  notes?: string;
}

export interface CheckOutInput {
  employeeId: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  notes?: string;
}

export interface BreakInput {
  employeeId: string;
  breakStart?: Date;
  breakEnd?: Date;
}

export interface AttendanceQuery {
  tenantId: string;
  employeeId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  skip?: number;
}

/**
 * Check in - Register employee arrival
 */
export async function checkIn(tenantId: string, input: CheckInInput) {
  const { employeeId, location, notes } = input;

  // Verify employee exists
  const employee = await Employee.findOne({ _id: employeeId, tenantId }).lean();
  if (!employee) {
    throw new Error('Employee not found');
  }

  // Get today's date (start of day in UTC)
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Check if already checked in today
  let attendance = await Attendance.findOne({ tenantId, employeeId, date: today });

  if (attendance && attendance.checkIn) {
    throw new Error('Already checked in today');
  }

  const checkInTime = new Date();

  if (attendance) {
    // Update existing record
    attendance.checkIn = checkInTime;
    attendance.checkInLocation = location;
    attendance.status = 'present';
    if (notes) attendance.notes = notes;

    // Check if late (assuming 9:00 AM is the expected time)
    const expectedCheckIn = new Date(today);
    expectedCheckIn.setUTCHours(9, 0, 0, 0);
    attendance.checkIfLate(expectedCheckIn);

    await attendance.save();
  } else {
    // Create new record
    attendance = await Attendance.create({
      tenantId,
      employeeId,
      employeeName: employee.name,
      date: today,
      checkIn: checkInTime,
      checkInLocation: location,
      status: 'present',
      notes,
    });

    // Check if late
    const expectedCheckIn = new Date(today);
    expectedCheckIn.setUTCHours(9, 0, 0, 0);
    attendance.checkIfLate(expectedCheckIn);
    await attendance.save();
  }

  return attendance.toObject();
}

/**
 * Check out - Register employee departure
 */
export async function checkOut(tenantId: string, input: CheckOutInput) {
  const { employeeId, location, notes } = input;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const attendance = await Attendance.findOne({ tenantId, employeeId, date: today });

  if (!attendance) {
    throw new Error('No check-in record found for today');
  }

  if (attendance.checkOut) {
    throw new Error('Already checked out today');
  }

  if (!attendance.checkIn) {
    throw new Error('Cannot check out without checking in first');
  }

  attendance.checkOut = new Date();
  attendance.checkOutLocation = location;
  if (notes) attendance.notes = notes;

  // Calculate hours worked (assuming 8 hours regular)
  const employee = await Employee.findOne({ _id: employeeId, tenantId }).select('monthlyHours').lean();
  const regularHoursPerDay = employee?.monthlyHours ? employee.monthlyHours / 22 : 8; // 22 working days per month
  attendance.calculateHours(regularHoursPerDay);

  await attendance.save();
  return attendance.toObject();
}

/**
 * Register break time
 */
export async function registerBreak(tenantId: string, input: BreakInput) {
  const { employeeId, breakStart, breakEnd } = input;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const attendance = await Attendance.findOne({ tenantId, employeeId, date: today });

  if (!attendance) {
    throw new Error('No check-in record found for today');
  }

  if (breakStart) {
    attendance.breakStart = breakStart;
  }

  if (breakEnd && attendance.breakStart) {
    attendance.breakEnd = breakEnd;
    const diffMs = breakEnd.getTime() - attendance.breakStart.getTime();
    attendance.breakMinutes = Math.floor(diffMs / (1000 * 60));
  }

  // Recalculate hours if checked out
  if (attendance.checkOut) {
    const employee = await Employee.findOne({ _id: employeeId, tenantId }).select('monthlyHours').lean();
    const regularHoursPerDay = employee?.monthlyHours ? employee.monthlyHours / 22 : 8;
    attendance.calculateHours(regularHoursPerDay);
  }

  await attendance.save();
  return attendance.toObject();
}

/**
 * Get today's attendance for an employee
 */
export async function getTodayAttendance(tenantId: string, employeeId: string) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let attendance = await Attendance.findOne({ tenantId, employeeId, date: today });

  if (!attendance) {
    // Return a placeholder for today
    return {
      tenantId,
      employeeId,
      date: today,
      status: 'absent',
      message: 'Not checked in yet',
    };
  }

  return attendance.toObject();
}

/**
 * List attendances with filters
 */
export async function listAttendances(query: AttendanceQuery) {
  const { tenantId, employeeId, status, startDate, endDate, limit = 50, skip = 0 } = query;

  const filter: any = { tenantId };
  if (employeeId) filter.employeeId = employeeId;
  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = startDate;
    if (endDate) filter.date.$lte = endDate;
  }

  const items = await Attendance.find(filter)
    .sort({ date: -1, checkIn: -1 })
    .limit(limit)
    .skip(skip)
    .lean();

  const total = await Attendance.countDocuments(filter);

  return { items, total };
}

/**
 * Get attendance summary for an employee
 */
export async function getAttendanceSummary(
  tenantId: string,
  employeeId: string,
  startDate: Date,
  endDate: Date
) {
  return Attendance.getSummary(tenantId, employeeId, startDate, endDate);
}

/**
 * Mark absence (admin/hr only)
 */
export async function markAbsence(
  tenantId: string,
  employeeId: string,
  date: Date,
  reason?: string
) {
  const employee = await Employee.findOne({ _id: employeeId, tenantId }).lean();
  if (!employee) {
    throw new Error('Employee not found');
  }

  const dateOnly = new Date(date);
  dateOnly.setUTCHours(0, 0, 0, 0);

  let attendance = await Attendance.findOne({ tenantId, employeeId, date: dateOnly });

  if (attendance) {
    attendance.status = 'absent';
    if (reason) attendance.notes = reason;
    await attendance.save();
  } else {
    attendance = await Attendance.create({
      tenantId,
      employeeId,
      employeeName: employee.name,
      date: dateOnly,
      status: 'absent',
      notes: reason,
    });
  }

  return attendance.toObject();
}

/**
 * Update attendance (admin/hr only)
 */
export async function updateAttendance(
  tenantId: string,
  attendanceId: string,
  updates: Partial<IAttendance>
) {
  const attendance = await Attendance.findOne({ _id: attendanceId, tenantId });

  if (!attendance) {
    throw new Error('Attendance record not found');
  }

  // Update allowed fields
  const allowedFields = ['status', 'notes', 'checkIn', 'checkOut', 'breakMinutes', 'approvedBy', 'approvedAt'];
  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      (attendance as any)[field] = updates[field];
    }
  });

  // Recalculate hours if check times changed
  if (updates.checkIn || updates.checkOut || updates.breakMinutes !== undefined) {
    const employee = await Employee.findOne({ _id: attendance.employeeId, tenantId }).select('monthlyHours').lean();
    const regularHoursPerDay = employee?.monthlyHours ? employee.monthlyHours / 22 : 8;
    attendance.calculateHours(regularHoursPerDay);
  }

  await attendance.save();
  return attendance.toObject();
}

/**
 * Delete attendance record (admin only)
 */
export async function deleteAttendance(tenantId: string, attendanceId: string) {
  const result = await Attendance.deleteOne({ _id: attendanceId, tenantId });
  return result.deletedCount > 0;
}
