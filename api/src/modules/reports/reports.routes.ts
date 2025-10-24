import type { FastifyInstance, FastifyReply } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import PDFDocument from 'pdfkit';

import { Application } from '../application/application.model.js';
import { Vacancy } from '../vacancy/vacancy.model.js';

// Advanced reporting services
import * as AttendanceReports from './attendance-reports.service.js';
import * as LeaveReports from './leave-reports.service.js';
import * as EmployeeReports from './employee-reports.service.js';
import * as ReportExport from './report-export.service.js';

// ---- Helpers de fechas ----
function parseDateLoose(s?: string): Date | undefined {
  if (!s) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(`${s}T00:00:00.000Z`);
  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : d;
}
function endOfDayUTC(d: Date) {
  const e = new Date(d);
  e.setUTCHours(23, 59, 59, 999);
  return e;
}
function normalizeRange(fromStr?: string, toStr?: string) {
  const from = parseDateLoose(fromStr);
  const toRaw = parseDateLoose(toStr);
  const to = toRaw ? endOfDayUTC(toRaw) : undefined;
  if (from && to && from.getTime() > to.getTime()) {
    throw new Error('`from` debe ser anterior o igual a `to`');
  }
  return { from, to };
}
function csv(headers: string[], rows: (string | number)[][]) {
  const head = headers.join(',');
  const lines = rows.map(r =>
    r.map(v => (typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : String(v))).join(',')
  );
  return [head, ...lines].join('\n');
}

export default async function reportsRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  const QuerySchema = z.object({
    from: z.string().optional(),
    to: z.string().optional(),
  });
  const ErrorSchema = z.object({ error: z.string() });

  // ========= CONVERSIÓN =========
  const ConvRes = z.object({ sent: z.number(), interview: z.number(), hired: z.number() });
  type ConvReply = z.infer<typeof ConvRes> | z.infer<typeof ErrorSchema>;

  r.get(
    '/',
    { schema: { hide: true, querystring: QuerySchema } },
    async () => ({ ok: true })
  );

  r.get<{ Querystring: z.infer<typeof QuerySchema>; Reply: ConvReply }>(
    '/conversion',
    {
      schema: {
        querystring: QuerySchema,
        response: {
          200: ConvRes,
          400: ErrorSchema,
        },
      },
    },
    async (req, reply) => {
      try {
        const { from, to } = normalizeRange(req.query.from, req.query.to);

        const base: any = {};
        if (from || to) {
          base.createdAt = {};
          if (from) base.createdAt.$gte = from;
          if (to) base.createdAt.$lte = to;
        }

        const sent = await Application.countDocuments(base);
        const interview = await Application.countDocuments({ ...base, status: 'interview' });
        const hired = await Application.countDocuments({ ...base, status: 'hired' });

        return reply.send({ sent, interview, hired });
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Invalid range' });
      }
    }
  );

  r.get(
    '/conversion.csv',
    { schema: { querystring: QuerySchema } },
    async (req, reply) => {
      try {
        const { from, to } = normalizeRange(req.query.from, req.query.to);

        const base: any = {};
        if (from || to) {
          base.createdAt = {};
          if (from) base.createdAt.$gte = from;
          if (to) base.createdAt.$lte = to;
        }

        const sent = await Application.countDocuments(base);
        const interview = await Application.countDocuments({ ...base, status: 'interview' });
        const hired = await Application.countDocuments({ ...base, status: 'hired' });

        const body = csv(['Métrica', 'Valor'], [
          ['Enviados', sent],
          ['Entrevistas', interview],
          ['Contratados', hired],
        ]);

        reply.header('Content-Type', 'text/csv; charset=utf-8');
        reply.header('Content-Disposition', 'attachment; filename="conversion.csv"');
        return reply.send(body);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Invalid range' });
      }
    }
  );

  r.get(
    '/conversion.pdf',
    { schema: { querystring: QuerySchema } },
    async (req, reply) => {
      try {
        const { from, to } = normalizeRange(req.query.from, req.query.to);

        const base: any = {};
        if (from || to) {
          base.createdAt = {};
          if (from) base.createdAt.$gte = from;
          if (to) base.createdAt.$lte = to;
        }

        const sent = await Application.countDocuments(base);
        const interview = await Application.countDocuments({ ...base, status: 'interview' });
        const hired = await Application.countDocuments({ ...base, status: 'hired' });

        reply.header('Content-Type', 'application/pdf');
        reply.header('Content-Disposition', 'attachment; filename="conversion.pdf"');

        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        doc.pipe(reply.raw);

        doc.fontSize(18).text('Reporte de Conversión', { underline: true });
        doc.moveDown();
        const rangeText = [
          from ? `Desde: ${from.toISOString()}` : '',
          to ? `Hasta: ${to.toISOString()}` : '',
        ].filter(Boolean).join('  |  ');
        if (rangeText) doc.fontSize(10).fillColor('#666').text(rangeText);

        doc.moveDown();
        doc.fontSize(12).fillColor('#000');
        doc.text(`Enviados:    ${sent}`);
        doc.text(`Entrevistas: ${interview}`);
        doc.text(`Contratados: ${hired}`);

        doc.end();
        return reply;
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Invalid range' });
      }
    }
  );

  // ========= TIME TO CLOSE =========
  const TTCRes = z.object({
    avgDays: z.number(),
    series: z.array(z.object({ week: z.string(), avgDays: z.number() })).optional(),
  });
  type TTCReply = z.infer<typeof TTCRes> | z.infer<typeof ErrorSchema>;

  r.get<{ Querystring: z.infer<typeof QuerySchema>; Reply: TTCReply }>(
    '/time-to-close',
    {
      schema: {
        querystring: QuerySchema,
        response: {
          200: TTCRes,
          400: ErrorSchema,
        },
      },
    },
    async (req, reply) => {
      try {
        const { from, to } = normalizeRange(req.query.from, req.query.to);

        const match: any = { status: 'closed' };
        if (from || to) {
          match.updatedAt = {};
          if (from) match.updatedAt.$gte = from;
          if (to) match.updatedAt.$lte = to;
        }

        const aggr = await Vacancy.aggregate([
          { $match: match },
          { $addFields: { closedAtEff: { $ifNull: ['$closedAt', '$updatedAt'] } } },
          { $addFields: { diffDays: { $divide: [{ $subtract: ['$closedAtEff', '$createdAt'] }, 1000 * 60 * 60 * 24] } } },
          {
            $facet: {
              overall: [{ $group: { _id: null, avg: { $avg: '$diffDays' } } }],
              byWeek: [
                { $addFields: { isoWeek: { $isoWeek: '$closedAtEff' }, isoYear: { $isoWeekYear: '$closedAtEff' } } },
                { $group: { _id: { y: '$isoYear', w: '$isoWeek' }, avg: { $avg: '$diffDays' } } },
                { $sort: { '_id.y': 1, '_id.w': 1 } },
              ],
            },
          },
        ]);

        const overallAvg = aggr?.[0]?.overall?.[0]?.avg ?? 0;
        const series = (aggr?.[0]?.byWeek ?? []).map((r: any) => ({
          week: `${r._id.y}-W${String(r._id.w).padStart(2, '0')}`,
          avgDays: Math.round(r.avg * 10) / 10,
        }));

        return reply.send({
          avgDays: Math.round((overallAvg ?? 0) * 10) / 10,
          series,
        });
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Invalid range' });
      }
    }
  );

  r.get(
    '/time-to-close.csv',
    { schema: { querystring: QuerySchema } },
    async (req, reply) => {
      try {
        const { from, to } = normalizeRange(req.query.from, req.query.to);

        const match: any = { status: 'closed' };
        if (from || to) {
          match.updatedAt = {};
          if (from) match.updatedAt.$gte = from;
          if (to) match.updatedAt.$lte = to;
        }

        const aggr = await Vacancy.aggregate([
          { $match: match },
          { $addFields: { closedAtEff: { $ifNull: ['$closedAt', '$updatedAt'] } } },
          { $addFields: { diffDays: { $divide: [{ $subtract: ['$closedAtEff', '$createdAt'] }, 1000 * 60 * 60 * 24] } } },
          { $addFields: { isoWeek: { $isoWeek: '$closedAtEff' }, isoYear: { $isoWeekYear: '$closedAtEff' } } },
          { $group: { _id: { y: '$isoYear', w: '$isoWeek' }, avg: { $avg: '$diffDays' } } },
          { $sort: { '_id.y': 1, '_id.w': 1 } },
        ]);

        const rows = aggr.map((r: any) => [
          `${r._id.y}-W${String(r._id.w).padStart(2, '0')}`,
          Math.round(r.avg * 10) / 10,
        ]);

        const body = csv(['Semana', 'AvgDiasCierre'], rows);
        reply.header('Content-Type', 'text/csv; charset=utf-8');
        reply.header('Content-Disposition', 'attachment; filename="time-to-close.csv"');
        return reply.send(body);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Invalid range' });
      }
    }
  );

  r.get(
    '/time-to-close.pdf',
    { schema: { querystring: QuerySchema } },
    async (req, reply) => {
      try {
        const { from, to } = normalizeRange(req.query.from, req.query.to);

        const match: any = { status: 'closed' };
        if (from || to) {
          match.updatedAt = {};
          if (from) match.updatedAt.$gte = from;
          if (to) match.updatedAt.$lte = to;
        }

        const aggr = await Vacancy.aggregate([
          { $match: match },
          { $addFields: { closedAtEff: { $ifNull: ['$closedAt', '$updatedAt'] } } },
          { $addFields: { diffDays: { $divide: [{ $subtract: ['$closedAtEff', '$createdAt'] }, 1000 * 60 * 60 * 24] } } },
          { $group: { _id: null, avg: { $avg: '$diffDays' } } },
        ]);

        const avgDays = Math.round(((aggr?.[0]?.avg ?? 0) as number) * 10) / 10;

        reply.header('Content-Type', 'application/pdf');
        reply.header('Content-Disposition', 'attachment; filename="time-to-close.pdf"');

        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        doc.pipe(reply.raw);

        doc.fontSize(18).text('Tiempo Promedio de Cierre', { underline: true });
        doc.moveDown();
        const rangeText = [
          from ? `Desde: ${from.toISOString()}` : '',
          to ? `Hasta: ${to.toISOString()}` : '',
        ].filter(Boolean).join('  |  ');
        if (rangeText) doc.fontSize(10).fillColor('#666').text(rangeText);

        doc.moveDown();
        doc.fontSize(12).fillColor('#000').text(`Promedio (días): ${avgDays}`);

        doc.end();
        return reply;
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Invalid range' });
      }
    }
  );

  // ========= ATTENDANCE REPORTS =========

  r.get(
    '/attendance/summary',
    {
      schema: {
        querystring: z.object({
          from: z.string(),
          to: z.string(),
          employeeId: z.string().optional(),
          department: z.string().optional(),
        }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const { from, to, employeeId, department } = req.query as any;
        const range = normalizeRange(from, to);
        const tenantId = (req as any).user?.tenantId || 'default';

        const result = await AttendanceReports.getAttendanceSummaryReport({
          tenantId,
          startDate: range.from!,
          endDate: range.to!,
          employeeId,
          department,
        });

        return reply.send(result);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Report error' });
      }
    }
  );

  r.get(
    '/attendance/overtime',
    {
      schema: {
        querystring: z.object({
          from: z.string(),
          to: z.string(),
          employeeId: z.string().optional(),
          minOvertimeHours: z.coerce.number().optional(),
        }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const { from, to, employeeId, minOvertimeHours } = req.query as any;
        const range = normalizeRange(from, to);
        const tenantId = (req as any).user?.tenantId || 'default';

        const result = await AttendanceReports.getOvertimeReport({
          tenantId,
          startDate: range.from!,
          endDate: range.to!,
          employeeId,
          minOvertimeHours,
        });

        return reply.send(result);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Report error' });
      }
    }
  );

  r.get(
    '/attendance/absences',
    {
      schema: {
        querystring: z.object({
          from: z.string(),
          to: z.string(),
          employeeId: z.string().optional(),
          includeLeaves: z.coerce.boolean().optional(),
        }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const { from, to, employeeId, includeLeaves } = req.query as any;
        const range = normalizeRange(from, to);
        const tenantId = (req as any).user?.tenantId || 'default';

        const result = await AttendanceReports.getAbsencesReport({
          tenantId,
          startDate: range.from!,
          endDate: range.to!,
          employeeId,
          includeLeaves,
        });

        return reply.send(result);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Report error' });
      }
    }
  );

  r.get(
    '/attendance/trend',
    {
      schema: {
        querystring: z.object({
          from: z.string(),
          to: z.string(),
          groupBy: z.enum(['week', 'month']).default('month'),
        }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const { from, to, groupBy } = req.query as any;
        const range = normalizeRange(from, to);
        const tenantId = (req as any).user?.tenantId || 'default';

        const result = await AttendanceReports.getAttendanceTrend({
          tenantId,
          startDate: range.from!,
          endDate: range.to!,
          groupBy,
        });

        return reply.send(result);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Report error' });
      }
    }
  );

  // ========= LEAVE REPORTS =========

  r.get(
    '/leaves/balance',
    {
      schema: {
        querystring: z.object({
          employeeId: z.string().optional(),
          department: z.string().optional(),
        }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const { employeeId, department } = req.query as any;
        const tenantId = (req as any).user?.tenantId || 'default';

        const result = await LeaveReports.getLeaveBalanceReport({
          tenantId,
          employeeId,
          department,
        });

        return reply.send(result);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Report error' });
      }
    }
  );

  r.get(
    '/leaves/usage',
    {
      schema: {
        querystring: z.object({
          from: z.string(),
          to: z.string(),
          employeeId: z.string().optional(),
          leaveType: z.string().optional(),
        }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const { from, to, employeeId, leaveType } = req.query as any;
        const range = normalizeRange(from, to);
        const tenantId = (req as any).user?.tenantId || 'default';

        const result = await LeaveReports.getLeaveUsageReport({
          tenantId,
          startDate: range.from!,
          endDate: range.to!,
          employeeId,
          leaveType,
        });

        return reply.send(result);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Report error' });
      }
    }
  );

  r.get(
    '/leaves/projections',
    {
      schema: {
        querystring: z.object({
          employeeId: z.string(),
          months: z.coerce.number().default(12),
        }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const { employeeId, months } = req.query as any;
        const tenantId = (req as any).user?.tenantId || 'default';

        const result = await LeaveReports.getLeaveProjections({
          tenantId,
          employeeId,
          months,
        });

        return reply.send(result);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Report error' });
      }
    }
  );

  r.get(
    '/leaves/statistics',
    {
      schema: {
        querystring: z.object({
          from: z.string(),
          to: z.string(),
          groupBy: z.enum(['type', 'month', 'department']).default('type'),
        }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const { from, to, groupBy } = req.query as any;
        const range = normalizeRange(from, to);
        const tenantId = (req as any).user?.tenantId || 'default';

        const result = await LeaveReports.getLeaveStatistics({
          tenantId,
          startDate: range.from!,
          endDate: range.to!,
          groupBy,
        });

        return reply.send(result);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Report error' });
      }
    }
  );

  // ========= EMPLOYEE REPORTS =========

  r.get(
    '/employees/demographics',
    {
      schema: {
        querystring: z.object({
          status: z.enum(['active', 'inactive', 'all']).default('active'),
        }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const { status } = req.query as any;
        const tenantId = (req as any).user?.tenantId || 'default';

        const result = await EmployeeReports.getEmployeeDemographics({
          tenantId,
          status,
        });

        return reply.send(result);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Report error' });
      }
    }
  );

  r.get(
    '/employees/turnover',
    {
      schema: {
        querystring: z.object({
          from: z.string(),
          to: z.string(),
        }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const { from, to } = req.query as any;
        const range = normalizeRange(from, to);
        const tenantId = (req as any).user?.tenantId || 'default';

        const result = await EmployeeReports.getTurnoverReport({
          tenantId,
          startDate: range.from!,
          endDate: range.to!,
        });

        return reply.send(result);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Report error' });
      }
    }
  );

  r.get(
    '/employees/headcount-trend',
    {
      schema: {
        querystring: z.object({
          from: z.string(),
          to: z.string(),
          groupBy: z.enum(['month', 'quarter']).default('month'),
        }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const { from, to, groupBy } = req.query as any;
        const range = normalizeRange(from, to);
        const tenantId = (req as any).user?.tenantId || 'default';

        const result = await EmployeeReports.getHeadcountTrend({
          tenantId,
          startDate: range.from!,
          endDate: range.to!,
          groupBy,
        });

        return reply.send(result);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Report error' });
      }
    }
  );

  r.get(
    '/employees/salary-distribution',
    {
      schema: {
        querystring: z.object({
          groupBy: z.enum(['department', 'position', 'seniority']).default('department'),
        }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const { groupBy } = req.query as any;
        const tenantId = (req as any).user?.tenantId || 'default';

        const result = await EmployeeReports.getSalaryDistribution({
          tenantId,
          groupBy,
        });

        return reply.send(result);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Report error' });
      }
    }
  );

  r.get(
    '/employees/upcoming-birthdays',
    {
      schema: {
        querystring: z.object({
          days: z.coerce.number().default(30),
        }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const { days } = req.query as any;
        const tenantId = (req as any).user?.tenantId || 'default';

        const result = await EmployeeReports.getUpcomingBirthdays({
          tenantId,
          days,
        });

        return reply.send(result);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Report error' });
      }
    }
  );

  // ========= EXPORT ENDPOINTS (Excel & PDF) =========

  // Attendance Summary Export
  r.get(
    '/attendance/summary.xlsx',
    {
      schema: {
        querystring: z.object({
          from: z.string(),
          to: z.string(),
          employeeId: z.string().optional(),
          department: z.string().optional(),
        }),
      },
    },
    async (req, reply) => {
      try {
        const { from, to, employeeId, department } = req.query as any;
        const range = normalizeRange(from, to);
        const tenantId = (req as any).user?.tenantId || 'default';

        const data = await AttendanceReports.getAttendanceSummaryReport({
          tenantId,
          startDate: range.from!,
          endDate: range.to!,
          employeeId,
          department,
        });

        const filename = `attendance-summary-${from}-${to}.xlsx`;

        return await ReportExport.streamExcelReport(reply, {
          filename,
          metadata: {
            reportType: 'Resumen de Asistencia',
            generatedBy: (req as any).user?.name || 'Sistema RRHH',
          },
          sheets: [
            {
              name: 'Resumen Asistencia',
              title: `Resumen de Asistencia - ${from} a ${to}`,
              columns: [
                { header: 'Empleado', key: 'employeeName', width: 25 },
                { header: 'Total Días', key: 'totalDays', width: 12 },
                { header: 'Horas Totales', key: 'totalHours', width: 15 },
                { header: 'Horas Regulares', key: 'totalRegularHours', width: 15 },
                { header: 'Horas Extra', key: 'totalOvertimeHours', width: 15 },
                { header: 'Días Presente', key: 'daysPresent', width: 15 },
                { header: 'Días Ausente', key: 'daysAbsent', width: 15 },
                { header: 'Días Tarde', key: 'daysLate', width: 12 },
                { header: 'Días Medio', key: 'daysHalfDay', width: 12 },
                { header: 'Días Licencia', key: 'daysLeave', width: 15 },
                { header: 'Días Feriado', key: 'daysHoliday', width: 15 },
                { header: 'Promedio Hrs/Día', key: 'averageHoursPerDay', width: 18 },
                { header: 'Tasa Asistencia %', key: 'attendanceRate', width: 18 },
              ],
              data: data.map((row: any) => ({
                employeeName: row.employeeName || 'N/A',
                totalDays: row.totalDays || 0,
                totalHours: Math.round((row.totalHours || 0) * 100) / 100,
                totalRegularHours: Math.round((row.totalRegularHours || 0) * 100) / 100,
                totalOvertimeHours: Math.round((row.totalOvertimeHours || 0) * 100) / 100,
                daysPresent: row.daysPresent || 0,
                daysAbsent: row.daysAbsent || 0,
                daysLate: row.daysLate || 0,
                daysHalfDay: row.daysHalfDay || 0,
                daysLeave: row.daysLeave || 0,
                daysHoliday: row.daysHoliday || 0,
                averageHoursPerDay: Math.round((row.averageHoursPerDay || 0) * 100) / 100,
                attendanceRate: Math.round((row.attendanceRate || 0) * 100) / 100,
              })),
              totals: true,
            },
          ],
        });
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Export error' });
      }
    }
  );

  r.get(
    '/attendance/summary.pdf',
    {
      schema: {
        querystring: z.object({
          from: z.string(),
          to: z.string(),
          employeeId: z.string().optional(),
          department: z.string().optional(),
        }),
      },
    },
    async (req, reply) => {
      try {
        const { from, to, employeeId, department } = req.query as any;
        const range = normalizeRange(from, to);
        const tenantId = (req as any).user?.tenantId || 'default';

        const data = await AttendanceReports.getAttendanceSummaryReport({
          tenantId,
          startDate: range.from!,
          endDate: range.to!,
          employeeId,
          department,
        });

        const filename = `attendance-summary-${from}-${to}.pdf`;

        return await ReportExport.generatePDFReport(reply, {
          filename,
          title: 'Resumen de Asistencia',
          subtitle: `Período: ${from} a ${to}`,
          metadata: {
            reportType: 'Asistencia',
            generatedBy: (req as any).user?.name || 'Sistema RRHH',
            generatedAt: new Date(),
          },
          tables: [
            {
              columns: [
                { header: 'Empleado', key: 'employeeName', width: 3, align: 'left' },
                { header: 'Días', key: 'totalDays', width: 1, align: 'center' },
                { header: 'Horas', key: 'totalHours', width: 1.5, align: 'right' },
                { header: 'Presente', key: 'daysPresent', width: 1.5, align: 'center' },
                { header: 'Ausente', key: 'daysAbsent', width: 1.5, align: 'center' },
                { header: 'Asistencia %', key: 'attendanceRate', width: 2, align: 'right' },
              ],
              data: data.map((row: any) => ({
                employeeName: row.employeeName || 'N/A',
                totalDays: row.totalDays || 0,
                totalHours: Math.round((row.totalHours || 0) * 10) / 10,
                daysPresent: row.daysPresent || 0,
                daysAbsent: row.daysAbsent || 0,
                attendanceRate: `${Math.round((row.attendanceRate || 0) * 10) / 10}%`,
              })),
            },
          ],
        });
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Export error' });
      }
    }
  );

  // Leave Balance Export
  r.get(
    '/leaves/balance.xlsx',
    {
      schema: {
        querystring: z.object({
          employeeId: z.string().optional(),
          department: z.string().optional(),
        }),
      },
    },
    async (req, reply) => {
      try {
        const { employeeId, department } = req.query as any;
        const tenantId = (req as any).user?.tenantId || 'default';

        const data = await LeaveReports.getLeaveBalanceReport({
          tenantId,
          employeeId,
          department,
        });

        const filename = `leave-balance-${new Date().toISOString().slice(0, 10)}.xlsx`;

        // Flatten data for Excel
        const flatData = data.flatMap((emp: any) => {
          const rows = [];
          for (const [leaveType, balance] of Object.entries(emp.balances)) {
            rows.push({
              employeeName: emp.employeeName,
              department: emp.department,
              leaveType,
              total: (balance as any).total,
              used: (balance as any).used,
              pending: (balance as any).pending,
              available: (balance as any).available,
            });
          }
          return rows;
        });

        return await ReportExport.streamExcelReport(reply, {
          filename,
          metadata: {
            reportType: 'Balance de Licencias',
            generatedBy: (req as any).user?.name || 'Sistema RRHH',
          },
          sheets: [
            {
              name: 'Balance Licencias',
              title: 'Balance de Licencias por Empleado',
              columns: [
                { header: 'Empleado', key: 'employeeName', width: 25 },
                { header: 'Departamento', key: 'department', width: 20 },
                { header: 'Tipo Licencia', key: 'leaveType', width: 18 },
                { header: 'Total Días', key: 'total', width: 12 },
                { header: 'Usados', key: 'used', width: 10 },
                { header: 'Pendientes', key: 'pending', width: 12 },
                { header: 'Disponibles', key: 'available', width: 12 },
              ],
              data: flatData,
              totals: false,
            },
          ],
        });
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Export error' });
      }
    }
  );

  r.get(
    '/leaves/balance.pdf',
    {
      schema: {
        querystring: z.object({
          employeeId: z.string().optional(),
          department: z.string().optional(),
        }),
      },
    },
    async (req, reply) => {
      try {
        const { employeeId, department } = req.query as any;
        const tenantId = (req as any).user?.tenantId || 'default';

        const data = await LeaveReports.getLeaveBalanceReport({
          tenantId,
          employeeId,
          department,
        });

        const filename = `leave-balance-${new Date().toISOString().slice(0, 10)}.pdf`;

        // Flatten data for PDF
        const flatData = data.flatMap((emp: any) => {
          const rows = [];
          for (const [leaveType, balance] of Object.entries(emp.balances)) {
            rows.push({
              employeeName: emp.employeeName,
              leaveType,
              total: (balance as any).total,
              used: (balance as any).used,
              available: (balance as any).available,
            });
          }
          return rows;
        });

        return await ReportExport.generatePDFReport(reply, {
          filename,
          title: 'Balance de Licencias',
          subtitle: 'Estado actual de días de licencia por empleado',
          metadata: {
            reportType: 'Licencias',
            generatedBy: (req as any).user?.name || 'Sistema RRHH',
            generatedAt: new Date(),
          },
          tables: [
            {
              columns: [
                { header: 'Empleado', key: 'employeeName', width: 3, align: 'left' },
                { header: 'Tipo', key: 'leaveType', width: 2, align: 'left' },
                { header: 'Total', key: 'total', width: 1.5, align: 'center' },
                { header: 'Usados', key: 'used', width: 1.5, align: 'center' },
                { header: 'Disponibles', key: 'available', width: 2, align: 'center' },
              ],
              data: flatData,
            },
          ],
        });
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Export error' });
      }
    }
  );

  // Employee Demographics Export
  r.get(
    '/employees/demographics.xlsx',
    {
      schema: {
        querystring: z.object({
          status: z.enum(['active', 'inactive', 'all']).default('active'),
        }),
      },
    },
    async (req, reply) => {
      try {
        const { status } = req.query as any;
        const tenantId = (req as any).user?.tenantId || 'default';

        const data = await EmployeeReports.getEmployeeDemographics({
          tenantId,
          status,
        });

        const filename = `employee-demographics-${new Date().toISOString().slice(0, 10)}.xlsx`;

        // Prepare data sheets
        const genderData = (data.byGender || []).map((item: any) => ({
          gender: item.gender || 'No especificado',
          count: item.count,
          percentage: Math.round(item.percentage * 100) / 100,
        }));

        const departmentData = (data.byDepartment || []).map((item: any) => ({
          department: item.department || 'No especificado',
          count: item.count,
          percentage: Math.round(item.percentage * 100) / 100,
        }));

        const positionData = (data.byPosition || []).map((item: any) => ({
          position: item.position || 'No especificado',
          count: item.count,
          percentage: Math.round(item.percentage * 100) / 100,
        }));

        const seniorityData = (data.bySeniority || []).map((item: any) => ({
          seniority: item.range,
          count: item.count,
          percentage: Math.round(item.percentage * 100) / 100,
        }));

        return await ReportExport.streamExcelReport(reply, {
          filename,
          metadata: {
            reportType: 'Demografía de Empleados',
            generatedBy: (req as any).user?.name || 'Sistema RRHH',
          },
          sheets: [
            {
              name: 'Resumen',
              title: 'Resumen Demográfico',
              summary: [
                { label: 'Total Empleados', value: data.totalEmployees || 0 },
              ],
              columns: [
                { header: 'Métrica', key: 'label', width: 30 },
                { header: 'Valor', key: 'value', width: 15 },
              ],
              data: [],
            },
            {
              name: 'Por Género',
              title: 'Distribución por Género',
              columns: [
                { header: 'Género', key: 'gender', width: 20 },
                { header: 'Cantidad', key: 'count', width: 15 },
                { header: 'Porcentaje %', key: 'percentage', width: 15 },
              ],
              data: genderData,
            },
            {
              name: 'Por Departamento',
              title: 'Distribución por Departamento',
              columns: [
                { header: 'Departamento', key: 'department', width: 25 },
                { header: 'Cantidad', key: 'count', width: 15 },
                { header: 'Porcentaje %', key: 'percentage', width: 15 },
              ],
              data: departmentData,
            },
            {
              name: 'Por Cargo',
              title: 'Distribución por Cargo',
              columns: [
                { header: 'Cargo', key: 'position', width: 25 },
                { header: 'Cantidad', key: 'count', width: 15 },
                { header: 'Porcentaje %', key: 'percentage', width: 15 },
              ],
              data: positionData,
            },
            {
              name: 'Por Antigüedad',
              title: 'Distribución por Antigüedad',
              columns: [
                { header: 'Antigüedad', key: 'seniority', width: 25 },
                { header: 'Cantidad', key: 'count', width: 15 },
                { header: 'Porcentaje %', key: 'percentage', width: 15 },
              ],
              data: seniorityData,
            },
          ],
        });
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Export error' });
      }
    }
  );

  r.get(
    '/employees/demographics.pdf',
    {
      schema: {
        querystring: z.object({
          status: z.enum(['active', 'inactive', 'all']).default('active'),
        }),
      },
    },
    async (req, reply) => {
      try {
        const { status } = req.query as any;
        const tenantId = (req as any).user?.tenantId || 'default';

        const data = await EmployeeReports.getEmployeeDemographics({
          tenantId,
          status,
        });

        const filename = `employee-demographics-${new Date().toISOString().slice(0, 10)}.pdf`;

        const departmentData = (data.byDepartment || []).map((dept: any) => ({
          department: dept.department || 'No especificado',
          count: dept.count,
          percentage: `${Math.round((dept.percentage || 0) * 10) / 10}%`,
        }));

        return await ReportExport.generatePDFReport(reply, {
          filename,
          title: 'Demografía de Empleados',
          subtitle: `Total: ${data.totalEmployees || 0} empleados`,
          metadata: {
            reportType: 'Demografía',
            generatedBy: (req as any).user?.name || 'Sistema RRHH',
            generatedAt: new Date(),
          },
          tables: [
            {
              title: 'Distribución por Departamento',
              columns: [
                { header: 'Departamento', key: 'department', width: 4, align: 'left' },
                { header: 'Cantidad', key: 'count', width: 2, align: 'center' },
                { header: 'Porcentaje', key: 'percentage', width: 2, align: 'right' },
              ],
              data: departmentData,
            },
          ],
        });
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Export error' });
      }
    }
  );

  // ========= CUSTOM REPORTS (Report Builder) =========

  // List custom reports
  r.get(
    '/custom',
    {
      schema: {
        querystring: z.object({
          reportType: z.enum(['attendance', 'leaves', 'employees', 'payroll']).optional(),
          includePublic: z.coerce.boolean().optional(),
        }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const { reportType, includePublic } = req.query as any;
        const tenantId = (req as any).user?.tenantId || 'default';
        const userId = (req as any).user?.id || 'unknown';

        const CustomReportService = await import('./custom-report.service.js');
        const reports = await CustomReportService.listCustomReports({
          tenantId,
          userId,
          reportType,
          includePublic,
        });

        return reply.send(reports);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error listing reports' });
      }
    }
  );

  // Create custom report
  r.post(
    '/custom',
    {
      schema: {
        body: z.object({
          name: z.string(),
          description: z.string().optional(),
          reportType: z.enum(['attendance', 'leaves', 'employees', 'payroll']),
          fields: z.array(z.string()),
          filters: z.any(),
          sortBy: z
            .object({
              field: z.string(),
              order: z.enum(['asc', 'desc']),
            })
            .optional(),
          isPublic: z.boolean().optional(),
        }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const tenantId = (req as any).user?.tenantId || 'default';
        const userId = (req as any).user?.id || 'unknown';
        const userName = (req as any).user?.name || 'Unknown User';

        const CustomReportService = await import('./custom-report.service.js');
        const report = await CustomReportService.createCustomReport({
          tenantId,
          userId,
          userName,
          ...(req.body as any),
        });

        return reply.send(report);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error creating report' });
      }
    }
  );

  // Get custom report by ID
  r.get(
    '/custom/:reportId',
    {
      schema: {
        params: z.object({
          reportId: z.string(),
        }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const { reportId } = req.params as any;
        const tenantId = (req as any).user?.tenantId || 'default';
        const userId = (req as any).user?.id || 'unknown';

        const CustomReportService = await import('./custom-report.service.js');
        const report = await CustomReportService.getCustomReportById({
          tenantId,
          reportId,
          userId,
        });

        return reply.send(report);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error getting report' });
      }
    }
  );

  // Update custom report
  r.put(
    '/custom/:reportId',
    {
      schema: {
        params: z.object({
          reportId: z.string(),
        }),
        body: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          fields: z.array(z.string()).optional(),
          filters: z.any().optional(),
          sortBy: z
            .object({
              field: z.string(),
              order: z.enum(['asc', 'desc']),
            })
            .optional(),
          isPublic: z.boolean().optional(),
        }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const { reportId } = req.params as any;
        const tenantId = (req as any).user?.tenantId || 'default';
        const userId = (req as any).user?.id || 'unknown';

        const CustomReportService = await import('./custom-report.service.js');
        const report = await CustomReportService.updateCustomReport({
          tenantId,
          reportId,
          userId,
          updates: req.body as any,
        });

        return reply.send(report);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error updating report' });
      }
    }
  );

  // Delete custom report
  r.delete(
    '/custom/:reportId',
    {
      schema: {
        params: z.object({
          reportId: z.string(),
        }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const { reportId } = req.params as any;
        const tenantId = (req as any).user?.tenantId || 'default';
        const userId = (req as any).user?.id || 'unknown';

        const CustomReportService = await import('./custom-report.service.js');
        const result = await CustomReportService.deleteCustomReport({
          tenantId,
          reportId,
          userId,
        });

        return reply.send(result);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error deleting report' });
      }
    }
  );

  // Execute custom report
  r.post(
    '/custom/:reportId/execute',
    {
      schema: {
        params: z.object({
          reportId: z.string(),
        }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const { reportId } = req.params as any;
        const tenantId = (req as any).user?.tenantId || 'default';
        const userId = (req as any).user?.id || 'unknown';

        const CustomReportService = await import('./custom-report.service.js');
        const result = await CustomReportService.executeCustomReport({
          tenantId,
          reportId,
          userId,
        });

        return reply.send(result);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error executing report' });
      }
    }
  );

  // Toggle favorite
  r.post(
    '/custom/:reportId/favorite',
    {
      schema: {
        params: z.object({
          reportId: z.string(),
        }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const { reportId } = req.params as any;
        const tenantId = (req as any).user?.tenantId || 'default';
        const userId = (req as any).user?.id || 'unknown';

        const CustomReportService = await import('./custom-report.service.js');
        const report = await CustomReportService.toggleFavorite({
          tenantId,
          reportId,
          userId,
        });

        return reply.send(report);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error toggling favorite' });
      }
    }
  );
}
