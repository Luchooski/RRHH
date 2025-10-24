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
}
