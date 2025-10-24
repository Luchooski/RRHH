import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  CheckInSchema,
  CheckOutSchema,
  BreakSchema,
  MarkAbsenceSchema,
  UpdateAttendanceSchema,
  AttendanceQuerySchema,
  AttendanceSummaryQuerySchema,
} from './attendance.dto.js';
import * as svc from './attendance.service.js';
import { getReqUser, hasRole } from '../../middlewares/auth.js';

export default async function attendanceRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  /**
   * POST /attendance/check-in
   * Check in for today
   */
  r.post('/attendance/check-in', {
    preHandler: app.authGuard,
    schema: {
      body: CheckInSchema,
      response: { 200: z.any(), 400: z.any() },
    },
    handler: async (req: FastifyRequest, reply: FastifyReply) => {
      const user = getReqUser(req);
      const body = req.body as z.infer<typeof CheckInSchema>;

      try {
        const result = await svc.checkIn(user.tenantId, {
          employeeId: user.id,
          ...body,
        });
        return reply.code(200).send(result);
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    },
  });

  /**
   * POST /attendance/check-out
   * Check out for today
   */
  r.post('/attendance/check-out', {
    preHandler: app.authGuard,
    schema: {
      body: CheckOutSchema,
      response: { 200: z.any(), 400: z.any() },
    },
    handler: async (req: FastifyRequest, reply: FastifyReply) => {
      const user = getReqUser(req);
      const body = req.body as z.infer<typeof CheckOutSchema>;

      try {
        const result = await svc.checkOut(user.tenantId, {
          employeeId: user.id,
          ...body,
        });
        return reply.code(200).send(result);
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    },
  });

  /**
   * POST /attendance/break
   * Register break time
   */
  r.post('/attendance/break', {
    preHandler: app.authGuard,
    schema: {
      body: BreakSchema,
      response: { 200: z.any(), 400: z.any() },
    },
    handler: async (req: FastifyRequest, reply: FastifyReply) => {
      const user = getReqUser(req);
      const body = req.body as z.infer<typeof BreakSchema>;

      try {
        const result = await svc.registerBreak(user.tenantId, {
          employeeId: user.id,
          breakStart: body.breakStart ? new Date(body.breakStart) : undefined,
          breakEnd: body.breakEnd ? new Date(body.breakEnd) : undefined,
        });
        return reply.code(200).send(result);
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    },
  });

  /**
   * GET /attendance/today
   * Get today's attendance for current user
   */
  r.get('/attendance/today', {
    preHandler: app.authGuard,
    schema: {
      response: { 200: z.any() },
    },
    handler: async (req: FastifyRequest, reply: FastifyReply) => {
      const user = getReqUser(req);
      const result = await svc.getTodayAttendance(user.tenantId, user.id);
      return reply.code(200).send(result);
    },
  });

  /**
   * GET /attendance
   * List attendances with filters (employee sees own, admin/hr sees all)
   */
  r.get('/attendance', {
    preHandler: app.authGuard,
    schema: {
      querystring: AttendanceQuerySchema,
      response: { 200: z.any() },
    },
    handler: async (req: FastifyRequest, reply: FastifyReply) => {
      const user = getReqUser(req);
      const query = req.query as z.infer<typeof AttendanceQuerySchema>;

      // If employee role, restrict to own records
      let employeeId = query.employeeId;
      if (!hasRole(user, ['admin', 'hr'])) {
        employeeId = user.id;
      }

      const result = await svc.listAttendances({
        tenantId: user.tenantId,
        employeeId,
        status: query.status,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        limit: query.limit,
        skip: query.skip,
      });

      return reply.code(200).send(result);
    },
  });

  /**
   * GET /attendance/summary
   * Get attendance summary (employee sees own, admin/hr can see any)
   */
  r.get('/attendance/summary', {
    preHandler: app.authGuard,
    schema: {
      querystring: AttendanceSummaryQuerySchema,
      response: { 200: z.any(), 403: z.any() },
    },
    handler: async (req: FastifyRequest, reply: FastifyReply) => {
      const user = getReqUser(req);
      const query = req.query as z.infer<typeof AttendanceSummaryQuerySchema>;

      // Check permissions
      if (query.employeeId !== user.id && !hasRole(user, ['admin', 'hr'])) {
        return reply.code(403).send({ error: 'Forbidden' });
      }

      const result = await svc.getAttendanceSummary(
        user.tenantId,
        query.employeeId,
        new Date(query.startDate),
        new Date(query.endDate)
      );

      return reply.code(200).send(result);
    },
  });

  /**
   * POST /attendance/mark-absence
   * Mark absence for an employee (admin/hr only)
   */
  r.post('/attendance/mark-absence', {
    preHandler: app.authGuard,
    schema: {
      body: MarkAbsenceSchema,
      response: { 200: z.any(), 400: z.any(), 403: z.any() },
    },
    handler: async (req: FastifyRequest, reply: FastifyReply) => {
      const user = getReqUser(req);

      if (!hasRole(user, ['admin', 'hr'])) {
        return reply.code(403).send({ error: 'Forbidden: Admin or HR role required' });
      }

      const body = req.body as z.infer<typeof MarkAbsenceSchema>;

      try {
        const result = await svc.markAbsence(
          user.tenantId,
          body.employeeId,
          new Date(body.date),
          body.reason
        );
        return reply.code(200).send(result);
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    },
  });

  /**
   * PATCH /attendance/:id
   * Update attendance record (admin/hr only)
   */
  r.patch('/attendance/:id', {
    preHandler: app.authGuard,
    schema: {
      params: z.object({ id: z.string() }),
      body: UpdateAttendanceSchema,
      response: { 200: z.any(), 400: z.any(), 403: z.any() },
    },
    handler: async (req: FastifyRequest, reply: FastifyReply) => {
      const user = getReqUser(req);

      if (!hasRole(user, ['admin', 'hr'])) {
        return reply.code(403).send({ error: 'Forbidden: Admin or HR role required' });
      }

      const { id } = req.params as { id: string };
      const updates = req.body as z.infer<typeof UpdateAttendanceSchema>;

      // Convert string dates to Date objects
      const processedUpdates: any = { ...updates };
      if (updates.checkIn) processedUpdates.checkIn = new Date(updates.checkIn);
      if (updates.checkOut) processedUpdates.checkOut = new Date(updates.checkOut);
      if (updates.approvedAt) processedUpdates.approvedAt = new Date(updates.approvedAt);

      try {
        const result = await svc.updateAttendance(user.tenantId, id, processedUpdates);
        return reply.code(200).send(result);
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    },
  });

  /**
   * DELETE /attendance/:id
   * Delete attendance record (admin only)
   */
  r.delete('/attendance/:id', {
    preHandler: app.authGuard,
    schema: {
      params: z.object({ id: z.string() }),
      response: { 200: z.any(), 400: z.any(), 403: z.any() },
    },
    handler: async (req: FastifyRequest, reply: FastifyReply) => {
      const user = getReqUser(req);

      if (!hasRole(user, ['admin'])) {
        return reply.code(403).send({ error: 'Forbidden: Admin role required' });
      }

      const { id } = req.params as { id: string };

      try {
        const success = await svc.deleteAttendance(user.tenantId, id);
        if (success) {
          return reply.code(200).send({ ok: true });
        } else {
          return reply.code(400).send({ error: 'Attendance record not found' });
        }
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    },
  });
}
