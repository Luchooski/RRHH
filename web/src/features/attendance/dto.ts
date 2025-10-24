export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'leave' | 'holiday';

export type Location = {
  latitude: number;
  longitude: number;
  address?: string;
};

export type Attendance = {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;

  date: string;
  checkIn?: string;
  checkOut?: string;

  hoursWorked?: number;
  regularHours?: number;
  overtimeHours?: number;

  breakStart?: string;
  breakEnd?: string;
  breakMinutes?: number;

  checkInLocation?: Location;
  checkOutLocation?: Location;

  status: AttendanceStatus;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;

  notes?: string;
  approvedBy?: string;
  approvedAt?: string;

  createdAt: string;
  updatedAt: string;
};

export type CheckInInput = {
  location?: Location;
  notes?: string;
};

export type CheckOutInput = {
  location?: Location;
  notes?: string;
};

export type BreakInput = {
  breakStart?: string;
  breakEnd?: string;
};

export type MarkAbsenceInput = {
  employeeId: string;
  date: string;
  reason?: string;
};

export type UpdateAttendanceInput = {
  status?: AttendanceStatus;
  notes?: string;
  checkIn?: string;
  checkOut?: string;
  breakMinutes?: number;
  approvedBy?: string;
  approvedAt?: string;
};

export type AttendanceSummary = {
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  leave: number;
  holiday: number;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  averageHoursPerDay: number;
};

export type AttendanceListOut = {
  items: Attendance[];
  total: number;
};

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'Presente',
  absent: 'Ausente',
  late: 'Tarde',
  half_day: 'Medio día',
  leave: 'Licencia',
  holiday: 'Feriado',
};

export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  absent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  late: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  half_day: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  leave: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  holiday: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};
