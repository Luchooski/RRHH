import { Schema, model, Document, Model } from 'mongoose';

export interface IAttendance extends Document {
  tenantId: string;
  employeeId: string;
  employeeName: string; // Denormalized for reporting

  date: Date; // Date only (YYYY-MM-DD)
  checkIn?: Date; // Full timestamp
  checkOut?: Date; // Full timestamp

  // Calculated fields
  hoursWorked?: number; // In hours (decimal)
  regularHours?: number; // Normal working hours
  overtimeHours?: number; // Hours beyond regular schedule

  // Break time
  breakStart?: Date;
  breakEnd?: Date;
  breakMinutes?: number;

  // Location (optional GPS)
  checkInLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  checkOutLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };

  // Status and notes
  status: 'present' | 'absent' | 'late' | 'half_day' | 'leave' | 'holiday';
  lateMinutes?: number;
  earlyLeaveMinutes?: number;

  notes?: string;
  approvedBy?: string;
  approvedAt?: Date;

  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  calculateHours(regularHoursPerDay?: number): void;
  checkIfLate(expectedCheckIn: Date): void;
}

// Interface for static methods
export interface IAttendanceModel extends Model<IAttendance> {
  getSummary(tenantId: string, employeeId: string, startDate: Date, endDate: Date): Promise<any>;
}

const LocationSchema = new Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  address: String,
}, { _id: false });

const AttendanceSchema = new Schema<IAttendance>({
  tenantId: { type: String, required: true, index: true },
  employeeId: { type: String, required: true, index: true },
  employeeName: { type: String, required: true },

  date: { type: Date, required: true, index: true },
  checkIn: Date,
  checkOut: Date,

  hoursWorked: Number,
  regularHours: Number,
  overtimeHours: Number,

  breakStart: Date,
  breakEnd: Date,
  breakMinutes: { type: Number, default: 0 },

  checkInLocation: LocationSchema,
  checkOutLocation: LocationSchema,

  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half_day', 'leave', 'holiday'],
    default: 'present',
    index: true,
  },
  lateMinutes: Number,
  earlyLeaveMinutes: Number,

  notes: String,
  approvedBy: String,
  approvedAt: Date,
}, {
  timestamps: true,
});

// Compound indexes
AttendanceSchema.index({ tenantId: 1, employeeId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ tenantId: 1, date: 1 });
AttendanceSchema.index({ tenantId: 1, status: 1, date: 1 });

// Method to calculate hours worked
AttendanceSchema.methods.calculateHours = function(regularHoursPerDay: number = 8) {
  if (!this.checkIn || !this.checkOut) {
    this.hoursWorked = 0;
    this.regularHours = 0;
    this.overtimeHours = 0;
    return;
  }

  const diffMs = this.checkOut.getTime() - this.checkIn.getTime();
  const breakMs = (this.breakMinutes || 0) * 60 * 1000;
  const totalMs = diffMs - breakMs;
  const totalHours = totalMs / (1000 * 60 * 60);

  this.hoursWorked = Math.max(0, Number(totalHours.toFixed(2)));
  this.regularHours = Math.min(this.hoursWorked, regularHoursPerDay);
  this.overtimeHours = Math.max(0, this.hoursWorked - regularHoursPerDay);
};

// Method to check if late
AttendanceSchema.methods.checkIfLate = function(expectedCheckIn: Date) {
  if (!this.checkIn) return;

  const diffMs = this.checkIn.getTime() - expectedCheckIn.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes > 0) {
    this.lateMinutes = diffMinutes;
    if (diffMinutes > 15) { // More than 15 minutes late
      this.status = 'late';
    }
  }
};

// Static method to get attendance summary
AttendanceSchema.statics.getSummary = async function(
  tenantId: string,
  employeeId: string,
  startDate: Date,
  endDate: Date
) {
  const attendances = await this.find({
    tenantId,
    employeeId,
    date: { $gte: startDate, $lte: endDate },
  }).lean();

  const summary = {
    totalDays: attendances.length,
    present: 0,
    absent: 0,
    late: 0,
    halfDay: 0,
    leave: 0,
    holiday: 0,
    totalHours: 0,
    regularHours: 0,
    overtimeHours: 0,
    averageHoursPerDay: 0,
  };

  attendances.forEach((att: any) => {
    summary[att.status]++;
    summary.totalHours += att.hoursWorked || 0;
    summary.regularHours += att.regularHours || 0;
    summary.overtimeHours += att.overtimeHours || 0;
  });

  summary.averageHoursPerDay = summary.totalDays > 0
    ? Number((summary.totalHours / summary.totalDays).toFixed(2))
    : 0;

  return summary;
};

export const Attendance = model<IAttendance, IAttendanceModel>('Attendance', AttendanceSchema);
