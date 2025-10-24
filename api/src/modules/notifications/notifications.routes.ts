import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import * as NotificationService from './notification.service.js';
import * as WorkflowService from './workflow.service.js';

export default async function notificationsRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  const ErrorSchema = z.object({ error: z.string() });

  // ========= NOTIFICATIONS =========

  // Get user notifications
  r.get(
    '/notifications',
    {
      schema: {
        querystring: z.object({
          isRead: z.coerce.boolean().optional(),
          category: z.string().optional(),
          limit: z.coerce.number().optional(),
          skip: z.coerce.number().optional(),
        }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const tenantId = (req as any).user?.tenantId || 'default';
        const userId = (req as any).user?.id || 'unknown';
        const { isRead, category, limit, skip } = req.query as any;

        const result = await NotificationService.getUserNotifications({
          tenantId,
          userId,
          isRead,
          category,
          limit,
          skip,
        });

        return reply.send(result);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error fetching notifications' });
      }
    }
  );

  // Get notification stats
  r.get(
    '/notifications/stats',
    {
      schema: {
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const tenantId = (req as any).user?.tenantId || 'default';
        const userId = (req as any).user?.id || 'unknown';

        const stats = await NotificationService.getNotificationStats({
          tenantId,
          userId,
        });

        return reply.send(stats);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error fetching stats' });
      }
    }
  );

  // Mark notification as read
  r.patch(
    '/notifications/:id/read',
    {
      schema: {
        params: z.object({ id: z.string() }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const tenantId = (req as any).user?.tenantId || 'default';
        const userId = (req as any).user?.id || 'unknown';
        const { id } = req.params as any;

        const notification = await NotificationService.markAsRead({
          tenantId,
          userId,
          notificationId: id,
        });

        return reply.send(notification);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error marking as read' });
      }
    }
  );

  // Mark all as read
  r.patch(
    '/notifications/read-all',
    {
      schema: {
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const tenantId = (req as any).user?.tenantId || 'default';
        const userId = (req as any).user?.id || 'unknown';

        const result = await NotificationService.markAllAsRead({
          tenantId,
          userId,
        });

        return reply.send(result);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error marking all as read' });
      }
    }
  );

  // Delete notification
  r.delete(
    '/notifications/:id',
    {
      schema: {
        params: z.object({ id: z.string() }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const tenantId = (req as any).user?.tenantId || 'default';
        const userId = (req as any).user?.id || 'unknown';
        const { id } = req.params as any;

        const result = await NotificationService.deleteNotification({
          tenantId,
          userId,
          notificationId: id,
        });

        return reply.send(result);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error deleting notification' });
      }
    }
  );

  // Create notification (admin only)
  r.post(
    '/notifications',
    {
      schema: {
        body: z.any(),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const tenantId = (req as any).user?.tenantId || 'default';
        const body = req.body as any;

        const notification = await NotificationService.createNotification({
          tenantId,
          ...body,
        });

        return reply.send(notification);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error creating notification' });
      }
    }
  );

  // Bulk create notifications (admin only)
  r.post(
    '/notifications/bulk',
    {
      schema: {
        body: z.any(),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const tenantId = (req as any).user?.tenantId || 'default';
        const body = req.body as any;

        const result = await NotificationService.bulkCreateNotifications({
          tenantId,
          ...body,
        });

        return reply.send(result);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error creating bulk notifications' });
      }
    }
  );

  // ========= WORKFLOWS =========

  // Get user's pending workflows
  r.get(
    '/workflows/pending',
    {
      schema: {
        querystring: z.object({
          limit: z.coerce.number().optional(),
          skip: z.coerce.number().optional(),
        }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const tenantId = (req as any).user?.tenantId || 'default';
        const userId = (req as any).user?.id || 'unknown';
        const { limit, skip } = req.query as any;

        const result = await WorkflowService.getUserPendingWorkflows({
          tenantId,
          userId,
          limit,
          skip,
        });

        return reply.send(result);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error fetching workflows' });
      }
    }
  );

  // Get user's created workflows
  r.get(
    '/workflows/created',
    {
      schema: {
        querystring: z.object({
          status: z.string().optional(),
          limit: z.coerce.number().optional(),
          skip: z.coerce.number().optional(),
        }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const tenantId = (req as any).user?.tenantId || 'default';
        const userId = (req as any).user?.id || 'unknown';
        const { status, limit, skip } = req.query as any;

        const result = await WorkflowService.getUserCreatedWorkflows({
          tenantId,
          userId,
          status,
          limit,
          skip,
        });

        return reply.send(result);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error fetching workflows' });
      }
    }
  );

  // Get workflow by ID
  r.get(
    '/workflows/:id',
    {
      schema: {
        params: z.object({ id: z.string() }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const tenantId = (req as any).user?.tenantId || 'default';
        const { id } = req.params as any;

        const workflow = await WorkflowService.getWorkflowById({
          tenantId,
          workflowId: id,
        });

        return reply.send(workflow);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error fetching workflow' });
      }
    }
  );

  // Get workflow stats
  r.get(
    '/workflows/stats',
    {
      schema: {
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const tenantId = (req as any).user?.tenantId || 'default';
        const userId = (req as any).user?.id || 'unknown';

        const stats = await WorkflowService.getWorkflowStats({
          tenantId,
          userId,
        });

        return reply.send(stats);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error fetching stats' });
      }
    }
  );

  // Create workflow
  r.post(
    '/workflows',
    {
      schema: {
        body: z.any(),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const tenantId = (req as any).user?.tenantId || 'default';
        const userId = (req as any).user?.id || 'unknown';
        const userName = (req as any).user?.name || 'Unknown User';
        const body = req.body as any;

        const workflow = await WorkflowService.createWorkflow({
          tenantId,
          requestedBy: userId,
          requestedByName: userName,
          ...body,
        });

        return reply.send(workflow);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error creating workflow' });
      }
    }
  );

  // Complete workflow step
  r.post(
    '/workflows/:workflowId/steps/:stepId/complete',
    {
      schema: {
        params: z.object({
          workflowId: z.string(),
          stepId: z.string(),
        }),
        body: z.object({
          comments: z.string().optional(),
          data: z.any().optional(),
        }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const tenantId = (req as any).user?.tenantId || 'default';
        const userId = (req as any).user?.id || 'unknown';
        const userName = (req as any).user?.name || 'Unknown User';
        const { workflowId, stepId } = req.params as any;
        const { comments, data } = req.body as any;

        const workflow = await WorkflowService.completeStep({
          tenantId,
          workflowId,
          stepId,
          completedBy: userId,
          completedByName: userName,
          comments,
          data,
        });

        return reply.send(workflow);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error completing step' });
      }
    }
  );

  // Reject workflow step
  r.post(
    '/workflows/:workflowId/steps/:stepId/reject',
    {
      schema: {
        params: z.object({
          workflowId: z.string(),
          stepId: z.string(),
        }),
        body: z.object({
          reason: z.string(),
        }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const tenantId = (req as any).user?.tenantId || 'default';
        const userId = (req as any).user?.id || 'unknown';
        const userName = (req as any).user?.name || 'Unknown User';
        const { workflowId, stepId } = req.params as any;
        const { reason } = req.body as any;

        const workflow = await WorkflowService.rejectStep({
          tenantId,
          workflowId,
          stepId,
          rejectedBy: userId,
          rejectedByName: userName,
          reason,
        });

        return reply.send(workflow);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error rejecting step' });
      }
    }
  );

  // Cancel workflow
  r.post(
    '/workflows/:id/cancel',
    {
      schema: {
        params: z.object({ id: z.string() }),
        body: z.object({
          reason: z.string(),
        }),
        response: { 200: z.any(), 400: ErrorSchema },
      },
    },
    async (req, reply) => {
      try {
        const tenantId = (req as any).user?.tenantId || 'default';
        const userId = (req as any).user?.id || 'unknown';
        const { id } = req.params as any;
        const { reason } = req.body as any;

        const workflow = await WorkflowService.cancelWorkflow({
          tenantId,
          workflowId: id,
          cancelledBy: userId,
          reason,
        });

        return reply.send(workflow);
      } catch (err: any) {
        return reply.code(400).send({ error: err?.message ?? 'Error cancelling workflow' });
      }
    }
  );
}
