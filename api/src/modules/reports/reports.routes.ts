import type { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { RangeQuery, ConversionOut, TtcOut } from './reports.dto.js';
import { z } from 'zod';
import PDFDocument from 'pdfkit';

// Ajustá estos imports si tus paths difieren
import { Application } from '../application/application.model.js';
import { Vacancy } from '../vacancy/vacancy.model.js';

function parseRange(q: { from?: string; to?: string }) {
  const filter: any = {};
  if (q.from || q.to) {
    filter.$and = [];
    if (q.from) filter.$and.push({ createdAt: { $gte: new Date(q.from!) } });
    if (q.to)   filter.$and.push({ createdAt: { $lte: new Date(q.to!) } });
  }
  return filter;
}

export const reportsRoutes: FastifyPluginAsync = async (app) => {
  const r = app.withTypeProvider<ZodTypeProvider>();

  // Conversión (Enviados/Entrevista/Contratados)
  r.route({
    method: 'GET',
    url: '/reports/conversion',
    schema: { querystring: RangeQuery, response: { 200: ConversionOut } },
    handler: async (req) => {
      const base = parseRange(req.query);
      const agg = await Application.aggregate([
        { $match: base.$and?.length ? { $and: base.$and } : {} },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);

      const byStatus = new Map<string, number>(agg.map(a => [a._id as string, a.count as number]));
      return {
        sent: byStatus.get('sent') ?? 0,
        interview: byStatus.get('interview') ?? 0,
        hired: byStatus.get('hired') ?? 0,
        period: { from: req.query.from, to: req.query.to },
      };
    },
  });

  // Tiempo promedio de cierre (vacantes cerradas)
  r.route({
    method: 'GET',
    url: '/reports/ttc',
    schema: { querystring: RangeQuery, response: { 200: TtcOut } },
    handler: async (req) => {
      const match: any = { status: 'closed' };
      if (req.query.from || req.query.to) {
        match.updatedAt = {};
        if (req.query.from) match.updatedAt.$gte = new Date(req.query.from!);
        if (req.query.to)   match.updatedAt.$lte = new Date(req.query.to!);
      }

      const agg = await Vacancy.aggregate([
        { $match: match },
        {
          $project: {
            days: {
              $divide: [
                { $subtract: ['$updatedAt', '$createdAt'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        },
        { $group: { _id: null, avgDays: { $avg: '$days' }, count: { $sum: 1 } } }
      ]);

      const avgDays = agg[0]?.avgDays ?? 0;
      const count   = agg[0]?.count ?? 0;

      return {
        avgDays: Number(avgDays.toFixed(1)),
        count,
        period: { from: req.query.from, to: req.query.to },
      };
    },
  });

  // CSV diario (sent/interview/hired por día)
  r.route({
    method: 'GET',
    url: '/reports/export.csv',
    schema: { querystring: RangeQuery, response: { 200: z.any() } },
    handler: async (req, reply) => {
      const base = parseRange(req.query);
      const agg = await Application.aggregate([
        { $match: base.$and?.length ? { $and: base.$and } : {} },
        { $project: {
          day: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d' } },
          status: 1
        }},
        { $group: { _id: { day: '$day', status: '$status' }, count: { $sum: 1 } } },
        { $sort: { '_id.day': 1 } },
      ]);

      // Pivot en Node para salida simple
      const map = new Map<string, { sent: number; interview: number; hired: number }>();
      for (const row of agg) {
        const day = row._id.day as string;
        const status = row._id.status as string;
        const entry = map.get(day) ?? { sent:0, interview:0, hired:0 };
        if (status === 'sent') entry.sent += row.count;
        if (status === 'interview') entry.interview += row.count;
        if (status === 'hired') entry.hired += row.count;
        map.set(day, entry);
      }

      let csv = 'day,sent,interview,hired\n';
      for (const [day, v] of map.entries()) {
        csv += `${day},${v.sent},${v.interview},${v.hired}\n`;
      }

      reply.header('Content-Type', 'text/csv; charset=utf-8');
      reply.header('Content-Disposition', 'attachment; filename="report.csv"');
      return reply.send(csv);
    },
  });

  // PDF con KPIs (conversión + ttc)
  r.route({
    method: 'GET',
    url: '/reports/export.pdf',
    schema: { querystring: RangeQuery, response: { 200: z.any() } },
    handler: async (req, reply) => {
      // Reutilizamos las funciones anteriores
      const q = req.query;
      const base = parseRange(q);
      const convAgg = await Application.aggregate([
        { $match: base.$and?.length ? { $and: base.$and } : {} },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);
      const byStatus = new Map<string, number>(convAgg.map(a => [a._id as string, a.count as number]));
      const sent = byStatus.get('sent') ?? 0;
      const interview = byStatus.get('interview') ?? 0;
      const hired = byStatus.get('hired') ?? 0;

      const match: any = { status: 'closed' };
      if (q.from || q.to) {
        match.updatedAt = {};
        if (q.from) match.updatedAt.$gte = new Date(q.from!);
        if (q.to)   match.updatedAt.$lte = new Date(q.to!);
      }
      const ttcAgg = await Vacancy.aggregate([
        { $match: match },
        {
          $project: {
            days: {
              $divide: [
                { $subtract: ['$updatedAt', '$createdAt'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        },
        { $group: { _id: null, avgDays: { $avg: '$days' }, count: { $sum: 1 } } }
      ]);
      const avgDays = Number((ttcAgg[0]?.avgDays ?? 0).toFixed(1));
      const count   = ttcAgg[0]?.count ?? 0;

      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Disposition', 'attachment; filename="report.pdf"');

      const doc = new PDFDocument({ size: 'A4', margin: 48 });
      doc.fontSize(18).text('Reporte de RRHH', { align: 'left' });
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor('#666')
        .text(`Período: ${q.from ?? '—'}  →  ${q.to ?? '—'}`);
      doc.moveDown();

      doc.fillColor('#000').fontSize(14).text('KPIs');
      doc.moveDown(0.25);
      doc.fontSize(12)
        .text(`Enviados: ${sent}`)
        .text(`Entrevista: ${interview}`)
        .text(`Contratados: ${hired}`);
      doc.moveDown();
      doc.text(`Tiempo promedio de cierre: ${avgDays} días (sobre ${count} vacantes cerradas)`);

      doc.end();
      return reply.send(doc as any);
    },
  });
};

export default reportsRoutes;
