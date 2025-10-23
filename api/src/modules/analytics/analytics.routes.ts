import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import * as svc from './analytics.service';
import { requirePermission } from '../permissions/permissions.middleware';
import { getReqUser } from '../../middlewares/auth';

export default async function analyticsRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  /**
   * GET /analytics/dashboard
   * Obtener todos los KPIs del dashboard
   */
  r.get('/analytics/dashboard', {
    preHandler: [app.authGuard, requirePermission('reports.read')],
    schema: {
      response: {
        200: z.any(),
        400: z.object({ error: z.string(), message: z.string() }),
      },
    },
    handler: async (req, reply) => {
      try {
        const user = getReqUser(req);
        const kpis = await svc.getDashboardKPIs(user.tenantId);
        return reply.code(200).send(kpis);
      } catch (error: any) {
        return reply.code(400).send({ error: 'Error', message: error.message });
      }
    },
  });

  /**
   * GET /analytics/trends/new-hires
   * Obtener tendencia de nuevas contrataciones
   */
  r.get('/analytics/trends/new-hires', {
    preHandler: [app.authGuard, requirePermission('reports.read')],
    schema: {
      querystring: z.object({
        months: z.coerce.number().int().min(1).max(12).default(6),
      }),
      response: {
        200: z.array(z.object({
          date: z.string(),
          value: z.number(),
        })),
      },
    },
    handler: async (req, reply) => {
      const user = getReqUser(req);
      const { months } = req.query;
      const trend = await svc.getNewHiresTrend(user.tenantId, months);
      return reply.code(200).send(trend);
    },
  });

  /**
   * GET /analytics/trends/applications
   * Obtener tendencia de aplicaciones
   */
  r.get('/analytics/trends/applications', {
    preHandler: [app.authGuard, requirePermission('reports.read')],
    schema: {
      querystring: z.object({
        months: z.coerce.number().int().min(1).max(12).default(6),
      }),
      response: {
        200: z.array(z.object({
          date: z.string(),
          value: z.number(),
        })),
      },
    },
    handler: async (req, reply) => {
      const user = getReqUser(req);
      const { months } = req.query;
      const trend = await svc.getApplicationsTrend(user.tenantId, months);
      return reply.code(200).send(trend);
    },
  });

  /**
   * GET /analytics/trends/attendance
   * Obtener tendencia de asistencia
   */
  r.get('/analytics/trends/attendance', {
    preHandler: [app.authGuard, requirePermission('reports.read')],
    schema: {
      querystring: z.object({
        days: z.coerce.number().int().min(1).max(90).default(30),
      }),
      response: {
        200: z.array(z.object({
          date: z.string(),
          value: z.number(),
        })),
      },
    },
    handler: async (req, reply) => {
      const user = getReqUser(req);
      const { days } = req.query;
      const trend = await svc.getAttendanceTrend(user.tenantId, days);
      return reply.code(200).send(trend);
    },
  });
}
