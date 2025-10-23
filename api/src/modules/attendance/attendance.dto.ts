import { z } from 'zod';

export const LocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().optional(),
}).optional();

export const CheckInSchema = z.object({
  location: LocationSchema,
  notes: z.string().optional(),
});

export const CheckOutSchema = z.object({
  location: LocationSchema,
  notes: z.string().optional(),
});

export const BreakSchema = z.object({
  breakStart: z.string().datetime().optional(),
  breakEnd: z.string().datetime().optional(),
});

export const MarkAbsenceSchema = z.object({
  employeeId: z.string(),
  date: z.string().date(),
  reason: z.string().optional(),
});

export const UpdateAttendanceSchema = z.object({
  status: z.enum(['present', 'absent', 'late', 'half_day', 'leave', 'holiday']).optional(),
  notes: z.string().optional(),
  checkIn: z.string().datetime().optional(),
  checkOut: z.string().datetime().optional(),
  breakMinutes: z.number().optional(),
  approvedBy: z.string().optional(),
  approvedAt: z.string().datetime().optional(),
});

export const AttendanceQuerySchema = z.object({
  employeeId: z.string().optional(),
  status: z.enum(['present', 'absent', 'late', 'half_day', 'leave', 'holiday']).optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  limit: z.coerce.number().optional(),
  skip: z.coerce.number().optional(),
});

export const AttendanceSummaryQuerySchema = z.object({
  employeeId: z.string(),
  startDate: z.string().date(),
  endDate: z.string().date(),
});
