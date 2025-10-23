import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { Notification } from './notification.model.js';

const NotificationOutputSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  userId: z.string(),
  userName: z.string(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  actionUrl: z.string().optional(),
  actionLabel: z.string().optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  read: z.boolean(),
  readAt: z.string().optional(),
  metadata: z.any().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

const NotificationQuerySchema = z.object({
  read: z.enum(['true', 'false']).optional(),
  type: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  skip: z.coerce.number().int().nonnegative().default(0)
});

export default async function notificationRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  // Todas las rutas requieren autenticación
  r.addHook('onRequest', app.authGuard);

  // GET /notifications - Obtener notificaciones del usuario
  r.get('/notifications', {
    schema: {
      querystring: NotificationQuerySchema,
      response: {
        200: z.object({
          items: z.array(NotificationOutputSchema),
          total: z.number(),
          unreadCount: z.number()
        })
      }
    },
    handler: async (req, reply) => {
      const user = (req as any).user;
      const query = req.query as z.infer<typeof NotificationQuerySchema>;

      const filter: any = {
        tenantId: user.tenantId,
        userId: user.sub
      };

      if (query.read !== undefined) {
        filter.read = query.read === 'true';
      }

      if (query.type) {
        filter.type = query.type;
      }

      const [items, total, unreadCount] = await Promise.all([
        Notification.find(filter)
          .sort({ createdAt: -1 })
          .limit(query.limit)
          .skip(query.skip)
          .lean(),
        Notification.countDocuments(filter),
        Notification.countDocuments({
          tenantId: user.tenantId,
          userId: user.sub,
          read: false
        })
      ]);

      return {
        items: items.map((item: any) => ({
          id: item._id.toString(),
          tenantId: item.tenantId,
          userId: item.userId,
          userName: item.userName,
          type: item.type,
          title: item.title,
          message: item.message,
          actionUrl: item.actionUrl,
          actionLabel: item.actionLabel,
          resourceType: item.resourceType,
          resourceId: item.resourceId,
          read: item.read,
          readAt: item.readAt?.toISOString(),
          metadata: item.metadata,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString()
        })),
        total,
        unreadCount
      };
    }
  });

  // GET /notifications/unread-count - Obtener solo el contador de no leídas
  r.get('/notifications/unread-count', {
    schema: {
      response: {
        200: z.object({
          count: z.number()
        })
      }
    },
    handler: async (req, reply) => {
      const user = (req as any).user;

      const count = await Notification.countDocuments({
        tenantId: user.tenantId,
        userId: user.sub,
        read: false
      });

      return { count };
    }
  });

  // PATCH /notifications/:id/read - Marcar notificación como leída
  r.patch('/notifications/:id/read', {
    schema: {
      params: z.object({ id: z.string().length(24) }),
      response: {
        200: z.object({ ok: z.boolean() }),
        404: z.any()
      }
    },
    handler: async (req, reply) => {
      const user = (req as any).user;
      const { id } = req.params as { id: string };

      const notification = await Notification.findOne({
        _id: id,
        tenantId: user.tenantId,
        userId: user.sub
      });

      if (!notification) {
        return reply.code(404).send({ error: 'Notificación no encontrada' });
      }

      if (!notification.read) {
        notification.read = true;
        notification.readAt = new Date();
        await notification.save();
      }

      return { ok: true };
    }
  });

  // POST /notifications/mark-all-read - Marcar todas como leídas
  r.post('/notifications/mark-all-read', {
    schema: {
      response: {
        200: z.object({
          ok: z.boolean(),
          modifiedCount: z.number()
        })
      }
    },
    handler: async (req, reply) => {
      const user = (req as any).user;

      const result = await Notification.updateMany(
        {
          tenantId: user.tenantId,
          userId: user.sub,
          read: false
        },
        {
          $set: {
            read: true,
            readAt: new Date()
          }
        }
      );

      return {
        ok: true,
        modifiedCount: result.modifiedCount
      };
    }
  });

  // DELETE /notifications/:id - Eliminar notificación
  r.delete('/notifications/:id', {
    schema: {
      params: z.object({ id: z.string().length(24) }),
      response: {
        200: z.object({ ok: z.boolean() }),
        404: z.any()
      }
    },
    handler: async (req, reply) => {
      const user = (req as any).user;
      const { id } = req.params as { id: string };

      const result = await Notification.deleteOne({
        _id: id,
        tenantId: user.tenantId,
        userId: user.sub
      });

      if (result.deletedCount === 0) {
        return reply.code(404).send({ error: 'Notificación no encontrada' });
      }

      return { ok: true };
    }
  });

  // DELETE /notifications - Eliminar todas las notificaciones leídas
  r.delete('/notifications', {
    schema: {
      response: {
        200: z.object({
          ok: z.boolean(),
          deletedCount: z.number()
        })
      }
    },
    handler: async (req, reply) => {
      const user = (req as any).user;

      const result = await Notification.deleteMany({
        tenantId: user.tenantId,
        userId: user.sub,
        read: true
      });

      return {
        ok: true,
        deletedCount: result.deletedCount
      };
    }
  });
}
