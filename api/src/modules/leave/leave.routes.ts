import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  LeaveRequestSchema,
  LeaveUpdateSchema,
  LeaveApprovalSchema,
  LeaveOutputSchema,
  LeaveQuerySchema,
  LeaveBalanceSchema
} from './leave.dto.js';
import * as service from './leave.service.js';

export default async function leaveRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  // Todas las rutas requieren autenticación
  r.addHook('onRequest', app.authGuard);

  // POST /leaves - Crear solicitud de licencia
  r.post('/leaves', {
    schema: {
      body: LeaveRequestSchema,
      response: {
        201: LeaveOutputSchema,
        400: z.any(),
        404: z.any()
      }
    },
    handler: async (req, reply) => {
      try {
        const user = (req as any).user;
        const leave = await service.createLeaveRequest(user.tenantId, req.body as any);
        return reply.code(201).send(leave);
      } catch (error: any) {
        if (error.message === 'EMPLOYEE_NOT_FOUND') {
          return reply.code(404).send({ error: 'Empleado no encontrado' });
        }
        if (error.message === 'END_DATE_BEFORE_START_DATE') {
          return reply.code(400).send({ error: 'La fecha de fin debe ser posterior a la fecha de inicio' });
        }
        if (error.message === 'OVERLAPPING_LEAVE') {
          return reply.code(400).send({ error: 'Ya existe una licencia aprobada en este período' });
        }
        throw error;
      }
    }
  });

  // GET /leaves - Listar licencias
  r.get('/leaves', {
    schema: {
      querystring: LeaveQuerySchema,
      response: {
        200: z.object({
          items: z.array(LeaveOutputSchema),
          total: z.number()
        })
      }
    },
    handler: async (req, reply) => {
      const user = (req as any).user;
      const result = await service.listLeaves(user.tenantId, req.query);
      return result;
    }
  });

  // GET /leaves/:id - Obtener detalle de licencia
  r.get('/leaves/:id', {
    schema: {
      params: z.object({ id: z.string().length(24) }),
      response: {
        200: LeaveOutputSchema,
        404: z.any()
      }
    },
    handler: async (req, reply) => {
      const user = (req as any).user;
      const { id } = req.params as { id: string };
      const leave = await service.getLeaveById(user.tenantId, id);

      if (!leave) {
        return reply.code(404).send({ error: 'Licencia no encontrada' });
      }

      return leave;
    }
  });

  // PATCH /leaves/:id - Actualizar solicitud (solo pending)
  r.patch('/leaves/:id', {
    schema: {
      params: z.object({ id: z.string().length(24) }),
      body: LeaveUpdateSchema,
      response: {
        200: LeaveOutputSchema,
        400: z.any(),
        404: z.any()
      }
    },
    handler: async (req, reply) => {
      try {
        const user = (req as any).user;
        const { id } = req.params as { id: string };
        const leave = await service.updateLeaveRequest(user.tenantId, id, req.body as any);

        if (!leave) {
          return reply.code(404).send({ error: 'Licencia no encontrada' });
        }

        return leave;
      } catch (error: any) {
        if (error.message === 'LEAVE_NOT_FOUND') {
          return reply.code(404).send({ error: 'Licencia no encontrada' });
        }
        if (error.message === 'CANNOT_UPDATE_NON_PENDING_LEAVE') {
          return reply.code(400).send({ error: 'Solo se pueden actualizar licencias pendientes' });
        }
        throw error;
      }
    }
  });

  // POST /leaves/:id/approve - Aprobar o rechazar licencia
  r.post('/leaves/:id/approve', {
    schema: {
      params: z.object({ id: z.string().length(24) }),
      body: LeaveApprovalSchema,
      response: {
        200: LeaveOutputSchema,
        400: z.any(),
        403: z.any(),
        404: z.any()
      }
    },
    handler: async (req, reply) => {
      try {
        const user = (req as any).user;
        const { id } = req.params as { id: string };

        // Solo admin y hr pueden aprobar
        if (!['admin', 'hr'].includes(user.role)) {
          return reply.code(403).send({ error: 'No tienes permisos para aprobar licencias' });
        }

        const leave = await service.approveOrRejectLeave(
          user.tenantId,
          id,
          req.body as any,
          user.sub,
          user.name
        );

        return leave;
      } catch (error: any) {
        if (error.message === 'LEAVE_NOT_FOUND') {
          return reply.code(404).send({ error: 'Licencia no encontrada' });
        }
        if (error.message === 'LEAVE_ALREADY_PROCESSED') {
          return reply.code(400).send({ error: 'Esta licencia ya fue procesada' });
        }
        throw error;
      }
    }
  });

  // POST /leaves/:id/cancel - Cancelar licencia
  r.post('/leaves/:id/cancel', {
    schema: {
      params: z.object({ id: z.string().length(24) }),
      response: {
        200: LeaveOutputSchema,
        400: z.any(),
        404: z.any()
      }
    },
    handler: async (req, reply) => {
      try {
        const user = (req as any).user;
        const { id } = req.params as { id: string };

        // TODO: Validar que el usuario sea el dueño de la licencia o admin/hr
        const leave = await service.cancelLeave(user.tenantId, id, user.sub);

        return leave;
      } catch (error: any) {
        if (error.message === 'LEAVE_NOT_FOUND') {
          return reply.code(404).send({ error: 'Licencia no encontrada' });
        }
        if (error.message === 'CANNOT_CANCEL_STARTED_LEAVE') {
          return reply.code(400).send({ error: 'No se puede cancelar una licencia que ya comenzó' });
        }
        throw error;
      }
    }
  });

  // DELETE /leaves/:id - Eliminar licencia
  r.delete('/leaves/:id', {
    schema: {
      params: z.object({ id: z.string().length(24) }),
      response: {
        200: z.object({ ok: z.boolean() }),
        400: z.any(),
        403: z.any(),
        404: z.any()
      }
    },
    handler: async (req, reply) => {
      try {
        const user = (req as any).user;
        const { id } = req.params as { id: string };

        // Solo admin y hr pueden eliminar
        if (!['admin', 'hr'].includes(user.role)) {
          return reply.code(403).send({ error: 'No tienes permisos para eliminar licencias' });
        }

        const deleted = await service.deleteLeave(user.tenantId, id);

        if (!deleted) {
          return reply.code(404).send({ error: 'Licencia no encontrada' });
        }

        return { ok: true };
      } catch (error: any) {
        if (error.message === 'CANNOT_DELETE_APPROVED_LEAVE') {
          return reply.code(400).send({ error: 'No se pueden eliminar licencias aprobadas o canceladas' });
        }
        throw error;
      }
    }
  });

  // GET /leaves/balance/:employeeId - Obtener balance de vacaciones
  r.get('/leaves/balance/:employeeId', {
    schema: {
      params: z.object({
        employeeId: z.string().length(24)
      }),
      querystring: z.object({
        year: z.coerce.number().int().min(2000).max(2100).optional()
      }),
      response: {
        200: LeaveBalanceSchema,
        404: z.any()
      }
    },
    handler: async (req, reply) => {
      try {
        const user = (req as any).user;
        const { employeeId } = req.params as { employeeId: string };
        const query = req.query as { year?: number };
        const year = query.year || new Date().getFullYear();

        const balance = await service.calculateLeaveBalance(user.tenantId, employeeId, year);

        return balance;
      } catch (error: any) {
        if (error.message === 'EMPLOYEE_NOT_FOUND') {
          return reply.code(404).send({ error: 'Empleado no encontrado' });
        }
        throw error;
      }
    }
  });
}
