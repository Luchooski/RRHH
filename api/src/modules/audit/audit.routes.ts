import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { AuditLog } from './audit.model.js';

const AuditLogOutputSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  userId: z.string(),
  userName: z.string(),
  action: z.string(),
  resource: z.string(),
  resourceId: z.string().optional(),
  resourceName: z.string().optional(),
  changes: z.any().optional(),
  metadata: z.any().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: z.string()
});

const AuditLogQuerySchema = z.object({
  userId: z.string().length(24).optional(),
  action: z.enum(['create', 'update', 'delete', 'login', 'logout', 'approve', 'reject', 'export', 'import', 'other']).optional(),
  resource: z.enum(['user', 'employee', 'candidate', 'vacancy', 'application', 'interview', 'payroll', 'leave', 'tenant', 'attachment', 'other']).optional(),
  resourceId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.coerce.number().int().positive().max(500).default(100),
  skip: z.coerce.number().int().nonnegative().default(0)
});

export default async function auditRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  // Todas las rutas requieren autenticación y rol admin
  r.addHook('onRequest', app.authGuard);

  // GET /audit-logs - Consultar logs de auditoría
  r.get('/audit-logs', {
    schema: {
      querystring: AuditLogQuerySchema,
      response: {
        200: z.object({
          items: z.array(AuditLogOutputSchema),
          total: z.number()
        }),
        403: z.any()
      }
    },
    handler: async (req, reply) => {
      const user = (req as any).user;

      // Solo admin puede ver audit logs
      if (user.role !== 'admin' && user.role !== 'superadmin') {
        return reply.code(403).send({ error: 'No tienes permisos para ver logs de auditoría' });
      }

      const query = req.query as z.infer<typeof AuditLogQuerySchema>;
      const filter: any = { tenantId: user.tenantId };

      if (query.userId) filter.userId = query.userId;
      if (query.action) filter.action = query.action;
      if (query.resource) filter.resource = query.resource;
      if (query.resourceId) filter.resourceId = query.resourceId;

      if (query.startDate || query.endDate) {
        filter.timestamp = {};
        if (query.startDate) filter.timestamp.$gte = new Date(query.startDate);
        if (query.endDate) filter.timestamp.$lte = new Date(query.endDate);
      }

      const [items, total] = await Promise.all([
        AuditLog.find(filter)
          .sort({ timestamp: -1 })
          .limit(query.limit)
          .skip(query.skip)
          .lean(),
        AuditLog.countDocuments(filter)
      ]);

      return {
        items: items.map((item: any) => ({
          id: item._id.toString(),
          tenantId: item.tenantId,
          userId: item.userId,
          userName: item.userName,
          action: item.action,
          resource: item.resource,
          resourceId: item.resourceId,
          resourceName: item.resourceName,
          changes: item.changes,
          metadata: item.metadata,
          ipAddress: item.ipAddress,
          userAgent: item.userAgent,
          timestamp: item.timestamp.toISOString()
        })),
        total
      };
    }
  });

  // GET /audit-logs/stats - Estadísticas de auditoría
  r.get('/audit-logs/stats', {
    schema: {
      querystring: z.object({
        days: z.coerce.number().int().min(1).max(90).default(30)
      }),
      response: {
        200: z.object({
          totalActions: z.number(),
          byAction: z.record(z.number()),
          byResource: z.record(z.number()),
          byUser: z.array(z.object({
            userId: z.string(),
            userName: z.string(),
            count: z.number()
          })).max(10)
        }),
        403: z.any()
      }
    },
    handler: async (req, reply) => {
      const user = (req as any).user;

      if (user.role !== 'admin' && user.role !== 'superadmin') {
        return reply.code(403).send({ error: 'No tienes permisos para ver estadísticas de auditoría' });
      }

      const query = req.query as { days: number };
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - query.days);

      const logs = await AuditLog.find({
        tenantId: user.tenantId,
        timestamp: { $gte: startDate }
      }).lean();

      const byAction: Record<string, number> = {};
      const byResource: Record<string, number> = {};
      const byUserMap: Map<string, { userName: string; count: number }> = new Map();

      logs.forEach((log: any) => {
        byAction[log.action] = (byAction[log.action] || 0) + 1;
        byResource[log.resource] = (byResource[log.resource] || 0) + 1;

        const userEntry = byUserMap.get(log.userId) || { userName: log.userName, count: 0 };
        userEntry.count++;
        byUserMap.set(log.userId, userEntry);
      });

      const byUser = Array.from(byUserMap.entries())
        .map(([userId, data]) => ({ userId, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalActions: logs.length,
        byAction,
        byResource,
        byUser
      };
    }
  });
}
