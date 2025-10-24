import type { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  CreateTenantSchema,
  UpdateTenantSchema,
  TenantOutputSchema,
  ErrorSchema
} from './tenant.dto.js';
import {
  createTenant,
  getTenantById,
  updateTenant,
  listTenants
} from './tenant.service.js';
import { CandidateModel } from '../candidates/candidate.model.js';

const tenantRoutes: FastifyPluginAsync = async (app) => {
  const r = app.withTypeProvider<ZodTypeProvider>();

  // GET /tenants/me - Obtener tenant del usuario actual
  r.route({
    method: 'GET',
    url: '/tenants/me',
    schema: {
      response: {
        200: TenantOutputSchema,
        404: ErrorSchema
      }
    },
    onRequest: [app.authGuard],
    handler: async (req, reply) => {
      const user = (req as any).user;
      const tenant = await getTenantById(user.tenantId);

      if (!tenant) {
        return reply.code(404).send({
          error: {
            code: 'TENANT_NOT_FOUND',
            message: 'Empresa no encontrada'
          }
        });
      }

      return tenant;
    }
  });

  // GET /tenants/me/application-trends - Obtener tendencias de aplicaciones
  r.route({
    method: 'GET',
    url: '/tenants/me/application-trends',
    schema: {
      querystring: z.object({
        days: z.coerce.number().min(7).max(90).default(30)
      }),
      response: {
        200: z.object({
          trends: z.array(z.object({
            date: z.string(),
            count: z.number(),
            careersPage: z.number()
          }))
        })
      }
    },
    onRequest: [app.authGuard],
    handler: async (req, reply) => {
      const user = (req as any).user;
      const { days } = req.query as { days: number };

      // Calcular fecha de inicio
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      // Agregación de MongoDB para contar aplicaciones por día
      const trends = await CandidateModel.aggregate([
        {
          $match: {
            tenantId: user.tenantId,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 },
            careersPage: {
              $sum: {
                $cond: [{ $eq: ['$source', 'careers_page'] }, 1, 0]
              }
            }
          }
        },
        {
          $sort: { _id: 1 }
        },
        {
          $project: {
            _id: 0,
            date: '$_id',
            count: 1,
            careersPage: 1
          }
        }
      ]);

      // Rellenar días sin datos con 0
      const trendsMap = new Map(trends.map((t: { date: string; count: number; careersPage: number }) => [t.date, t]));
      const result = [];

      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        const dateStr = date.toISOString().split('T')[0];

        result.push(trendsMap.get(dateStr) || {
          date: dateStr,
          count: 0,
          careersPage: 0
        });
      }

      return { trends: result };
    }
  });

  // POST /tenants/register - Registro de empresa (público)
  r.route({
    method: 'POST',
    url: '/tenants/register',
    schema: {
      body: CreateTenantSchema,
      response: {
        201: z.object({
          tenant: TenantOutputSchema,
          userId: z.string(),
          message: z.string()
        }),
        400: ErrorSchema,
        409: ErrorSchema
      }
    },
    handler: async (req, reply) => {
      try {
        const result = await createTenant(req.body);
        return reply.code(201).send({
          ...result,
          message: 'Empresa registrada exitosamente. Ya puedes iniciar sesión.'
        });
      } catch (error: any) {
        if (error.message === 'TENANT_EMAIL_EXISTS') {
          return reply.code(409).send({
            error: {
              code: 'TENANT_EMAIL_EXISTS',
              message: 'Ya existe una empresa con este email'
            }
          });
        }
        if (error.message === 'USER_EMAIL_EXISTS') {
          return reply.code(409).send({
            error: {
              code: 'USER_EMAIL_EXISTS',
              message: 'Ya existe un usuario con este email'
            }
          });
        }
        app.log.error(error);
        return reply.code(400).send({
          error: {
            code: 'REGISTRATION_FAILED',
            message: 'Error al registrar la empresa',
            details: error.message
          }
        });
      }
    }
  });

  // GET /tenants/:id - Obtener tenant por ID (requiere autenticación)
  r.route({
    method: 'GET',
    url: '/tenants/:id',
    schema: {
      params: z.object({ id: z.string() }),
      response: {
        200: TenantOutputSchema,
        404: ErrorSchema,
        403: ErrorSchema
      }
    },
    onRequest: [app.authGuard], // Usar el middleware de autenticación
    handler: async (req, reply) => {
      const tenant = await getTenantById(req.params.id);
      if (!tenant) {
        return reply.code(404).send({
          error: {
            code: 'TENANT_NOT_FOUND',
            message: 'Empresa no encontrada'
          }
        });
      }

      // Validar que el usuario solo pueda ver su propio tenant (a menos que sea admin global)
      const user = (req as any).user;
      if (user.role !== 'superadmin' && user.tenantId !== req.params.id) {
        return reply.code(403).send({
          error: {
            code: 'FORBIDDEN',
            message: 'No tienes permisos para ver esta empresa'
          }
        });
      }

      return tenant;
    }
  });

  // PATCH /tenants/:id - Actualizar tenant (requiere autenticación)
  r.route({
    method: 'PATCH',
    url: '/tenants/:id',
    schema: {
      params: z.object({ id: z.string() }),
      body: UpdateTenantSchema,
      response: {
        200: TenantOutputSchema,
        404: ErrorSchema,
        403: ErrorSchema
      }
    },
    onRequest: [app.authGuard],
    handler: async (req, reply) => {
      const user = (req as any).user;

      // Solo admins del tenant o superadmins pueden actualizar
      if (user.role !== 'superadmin' && user.tenantId !== req.params.id) {
        return reply.code(403).send({
          error: {
            code: 'FORBIDDEN',
            message: 'No tienes permisos para actualizar esta empresa'
          }
        });
      }

      if (user.role !== 'admin' && user.role !== 'superadmin') {
        return reply.code(403).send({
          error: {
            code: 'FORBIDDEN',
            message: 'Solo administradores pueden actualizar la empresa'
          }
        });
      }

      const tenant = await updateTenant(req.params.id, req.body);
      if (!tenant) {
        return reply.code(404).send({
          error: {
            code: 'TENANT_NOT_FOUND',
            message: 'Empresa no encontrada'
          }
        });
      }

      return tenant;
    }
  });

  // GET /tenants - Listar tenants (solo superadmin)
  r.route({
    method: 'GET',
    url: '/tenants',
    schema: {
      querystring: z.object({
        status: z.enum(['active', 'inactive', 'suspended']).optional(),
        plan: z.enum(['free', 'basic', 'professional', 'enterprise']).optional(),
        search: z.string().optional()
      }),
      response: {
        200: z.object({ items: z.array(TenantOutputSchema) }),
        403: ErrorSchema
      }
    },
    onRequest: [app.authGuard],
    handler: async (req, reply) => {
      const user = (req as any).user;

      // Solo superadmin puede listar todos los tenants
      if (user.role !== 'superadmin') {
        return reply.code(403).send({
          error: {
            code: 'FORBIDDEN',
            message: 'No tienes permisos para listar empresas'
          }
        });
      }

      const items = await listTenants(req.query);
      return { items };
    }
  });
};

export default tenantRoutes;
