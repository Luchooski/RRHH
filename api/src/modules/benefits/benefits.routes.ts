import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import * as svc from './benefits.service';
import * as dto from './benefits.dto';
import { requirePermission } from '../permissions/permissions.middleware';
import { getReqUser } from '../../middlewares/auth';

export default async function benefitsRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  // ===== Benefit Catalog Management =====

  /**
   * POST /benefits
   * Crear un beneficio en el catálogo
   */
  r.post('/benefits', {
    preHandler: [app.authGuard, requirePermission('settings.manage')],
    schema: {
      body: dto.CreateBenefitSchema,
      response: {
        201: z.any(),
        400: z.object({ error: z.string(), message: z.string() }),
      },
    },
    handler: async (req, reply) => {
      try {
        const user = getReqUser(req);
        const benefit = await svc.createBenefit(user.tenantId, req.body);
        return reply.code(201).send(benefit);
      } catch (error: any) {
        return reply.code(400).send({ error: 'Error', message: error.message });
      }
    },
  });

  /**
   * GET /benefits
   * Listar beneficios del catálogo
   */
  r.get('/benefits', {
    preHandler: [app.authGuard, requirePermission('settings.read')],
    schema: {
      querystring: dto.ListBenefitsQuerySchema,
      response: {
        200: z.array(z.any()),
      },
    },
    handler: async (req, reply) => {
      const user = getReqUser(req);
      const benefits = await svc.listBenefits(user.tenantId, req.query);
      return reply.code(200).send(benefits);
    },
  });

  /**
   * GET /benefits/:id
   * Obtener un beneficio específico
   */
  r.get('/benefits/:id', {
    preHandler: [app.authGuard, requirePermission('settings.read')],
    schema: {
      params: dto.BenefitIdParamsSchema,
      response: {
        200: z.any(),
        404: z.object({ error: z.string(), message: z.string() }),
      },
    },
    handler: async (req, reply) => {
      try {
        const user = getReqUser(req);
        const benefit = await svc.getBenefit(user.tenantId, req.params.id);
        return reply.code(200).send(benefit);
      } catch (error: any) {
        if (error.message === 'Beneficio no encontrado') {
          return reply.code(404).send({ error: 'Not Found', message: error.message });
        }
        return reply.code(400).send({ error: 'Error', message: error.message });
      }
    },
  });

  /**
   * PUT /benefits/:id
   * Actualizar un beneficio
   */
  r.put('/benefits/:id', {
    preHandler: [app.authGuard, requirePermission('settings.manage')],
    schema: {
      params: dto.BenefitIdParamsSchema,
      body: dto.UpdateBenefitSchema,
      response: {
        200: z.any(),
        404: z.object({ error: z.string(), message: z.string() }),
      },
    },
    handler: async (req, reply) => {
      try {
        const user = getReqUser(req);
        const benefit = await svc.updateBenefit(user.tenantId, req.params.id, req.body);
        return reply.code(200).send(benefit);
      } catch (error: any) {
        if (error.message === 'Beneficio no encontrado') {
          return reply.code(404).send({ error: 'Not Found', message: error.message });
        }
        return reply.code(400).send({ error: 'Error', message: error.message });
      }
    },
  });

  /**
   * DELETE /benefits/:id
   * Eliminar un beneficio
   */
  r.delete('/benefits/:id', {
    preHandler: [app.authGuard, requirePermission('settings.manage')],
    schema: {
      params: dto.BenefitIdParamsSchema,
      response: {
        200: z.object({ success: z.boolean() }),
        400: z.object({ error: z.string(), message: z.string() }),
        404: z.object({ error: z.string(), message: z.string() }),
      },
    },
    handler: async (req, reply) => {
      try {
        const user = getReqUser(req);
        await svc.deleteBenefit(user.tenantId, req.params.id);
        return reply.code(200).send({ success: true });
      } catch (error: any) {
        if (error.message === 'Beneficio no encontrado') {
          return reply.code(404).send({ error: 'Not Found', message: error.message });
        }
        return reply.code(400).send({ error: 'Error', message: error.message });
      }
    },
  });

  // ===== Employee Benefit Assignment =====

  /**
   * POST /employee-benefits
   * Asignar un beneficio a un empleado
   */
  r.post('/employee-benefits', {
    preHandler: [app.authGuard, requirePermission('employees.update')],
    schema: {
      body: dto.AssignBenefitSchema,
      response: {
        201: z.any(),
        400: z.object({ error: z.string(), message: z.string() }),
      },
    },
    handler: async (req, reply) => {
      try {
        const user = getReqUser(req);
        const assignment = await svc.assignBenefit(user.tenantId, {
          ...req.body,
          requestedBy: user.id,
        });
        return reply.code(201).send(assignment);
      } catch (error: any) {
        return reply.code(400).send({ error: 'Error', message: error.message });
      }
    },
  });

  /**
   * GET /employee-benefits
   * Listar beneficios asignados (con filtros)
   */
  r.get('/employee-benefits', {
    preHandler: [app.authGuard, requirePermission('employees.read')],
    schema: {
      querystring: dto.ListEmployeeBenefitsQuerySchema,
      response: {
        200: z.array(z.any()),
      },
    },
    handler: async (req, reply) => {
      const user = getReqUser(req);
      const { employeeId, status } = req.query;

      // Si no especifica employeeId y no es admin/hr, solo puede ver los suyos
      const targetEmployeeId = employeeId ||
        (user.role === 'admin' || user.role === 'hr' ? undefined : user.id);

      if (!targetEmployeeId) {
        // List all (admin/hr only)
        const query: any = { tenantId: user.tenantId };
        if (status) query.status = status;

        const assignments = await svc.listEmployeeBenefits(user.tenantId, '', { status });
        return reply.code(200).send(assignments);
      }

      const benefits = await svc.listEmployeeBenefits(user.tenantId, targetEmployeeId, { status });
      return reply.code(200).send(benefits);
    },
  });

  /**
   * POST /employee-benefits/:id/approve
   * Aprobar/rechazar una solicitud de beneficio
   */
  r.post('/employee-benefits/:id/approve', {
    preHandler: [app.authGuard, requirePermission('employees.update')],
    schema: {
      params: z.object({ id: z.string() }),
      body: dto.ApproveBenefitSchema,
      response: {
        200: z.any(),
        400: z.object({ error: z.string(), message: z.string() }),
        404: z.object({ error: z.string(), message: z.string() }),
      },
    },
    handler: async (req, reply) => {
      try {
        const user = getReqUser(req);
        const assignment = await svc.approveBenefit(
          user.tenantId,
          req.params.id,
          req.body.approved,
          user.id,
          req.body.rejectionReason
        );
        return reply.code(200).send(assignment);
      } catch (error: any) {
        if (error.message === 'Asignación no encontrada') {
          return reply.code(404).send({ error: 'Not Found', message: error.message });
        }
        return reply.code(400).send({ error: 'Error', message: error.message });
      }
    },
  });

  /**
   * POST /employee-benefits/:id/cancel
   * Cancelar un beneficio asignado
   */
  r.post('/employee-benefits/:id/cancel', {
    preHandler: [app.authGuard, requirePermission('employees.update')],
    schema: {
      params: z.object({ id: z.string() }),
      body: dto.CancelBenefitSchema,
      response: {
        200: z.any(),
        400: z.object({ error: z.string(), message: z.string() }),
        404: z.object({ error: z.string(), message: z.string() }),
      },
    },
    handler: async (req, reply) => {
      try {
        const user = getReqUser(req);
        const assignment = await svc.cancelBenefit(
          user.tenantId,
          req.params.id,
          req.body.reason
        );
        return reply.code(200).send(assignment);
      } catch (error: any) {
        if (error.message === 'Asignación no encontrada') {
          return reply.code(404).send({ error: 'Not Found', message: error.message });
        }
        return reply.code(400).send({ error: 'Error', message: error.message });
      }
    },
  });

  /**
   * GET /employee-benefits/cost-summary
   * Obtener resumen de costos de beneficios
   */
  r.get('/employee-benefits/cost-summary', {
    preHandler: [app.authGuard, requirePermission('reports.read')],
    schema: {
      querystring: dto.GetBenefitsCostSummaryQuerySchema,
      response: {
        200: z.any(),
      },
    },
    handler: async (req, reply) => {
      const user = getReqUser(req);
      const summary = await svc.getBenefitsCostSummary(user.tenantId, req.query);
      return reply.code(200).send(summary);
    },
  });
}
