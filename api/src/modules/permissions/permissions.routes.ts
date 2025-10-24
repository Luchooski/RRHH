import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import * as svc from './permissions.service.js';
import { requirePermission } from './permissions.middleware.js';

// Schemas de validación
const CreateRoleSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, 'Debe tener al menos un permiso'),
});

const UpdateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

const RoleIdParamsSchema = z.object({
  id: z.string(),
});

const RoleNameParamsSchema = z.object({
  name: z.string(),
});

function getReqUser(req: any) {
  if (!req.user) throw new Error('Unauthorized');
  return req.user as { id: string; email: string; role: string; tenantId: string };
}

export default async function permissionsRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  /**
   * GET /permissions/roles
   * Listar todos los roles (predefinidos + personalizados)
   */
  r.get('/permissions/roles', {
    preHandler: [app.authGuard, requirePermission('users.read')],
    schema: {
      response: {
        200: z.array(z.any()),
        400: z.object({ error: z.string(), message: z.string() }),
      },
    },
    handler: async (req, reply) => {
      try {
        const user = getReqUser(req);
        const roles = await svc.listRoles(user.tenantId);
        return reply.code(200).send(roles);
      } catch (error: any) {
        return reply.code(400).send({ error: 'Error', message: error.message });
      }
    },
  });

  /**
   * GET /permissions/roles/:name
   * Obtener un rol específico por nombre
   */
  r.get('/permissions/roles/:name', {
    preHandler: [app.authGuard, requirePermission('users.read')],
    schema: {
      params: RoleNameParamsSchema,
      response: {
        200: z.any(),
        400: z.object({ error: z.string(), message: z.string() }),
        404: z.object({ error: z.string(), message: z.string() }),
      },
    },
    handler: async (req, reply) => {
      try {
        const user = getReqUser(req);
        const { name } = req.params;
        const role = await svc.getRole(user.tenantId, name);
        return reply.code(200).send(role);
      } catch (error: any) {
        if (error.message === 'Rol no encontrado') {
          return reply.code(404).send({ error: 'Not Found', message: error.message });
        }
        return reply.code(400).send({ error: 'Error', message: error.message });
      }
    },
  });

  /**
   * POST /permissions/roles
   * Crear un rol personalizado
   */
  r.post('/permissions/roles', {
    preHandler: [app.authGuard, requirePermission('users.manage')],
    schema: {
      body: CreateRoleSchema,
      response: {
        201: z.any(),
        400: z.object({ error: z.string(), message: z.string() }),
      },
    },
    handler: async (req, reply) => {
      try {
        const user = getReqUser(req);
        const body = req.body;
        const role = await svc.createRole(user.tenantId, body);
        return reply.code(201).send(role);
      } catch (error: any) {
        return reply.code(400).send({ error: 'Error', message: error.message });
      }
    },
  });

  /**
   * PUT /permissions/roles/:id
   * Actualizar un rol personalizado
   */
  r.put('/permissions/roles/:id', {
    preHandler: [app.authGuard, requirePermission('users.manage')],
    schema: {
      params: RoleIdParamsSchema,
      body: UpdateRoleSchema,
      response: {
        200: z.any(),
        400: z.object({ error: z.string(), message: z.string() }),
        404: z.object({ error: z.string(), message: z.string() }),
      },
    },
    handler: async (req, reply) => {
      try {
        const user = getReqUser(req);
        const { id } = req.params;
        const body = req.body;
        const role = await svc.updateRole(user.tenantId, id, body);
        return reply.code(200).send(role);
      } catch (error: any) {
        if (error.message === 'Rol no encontrado') {
          return reply.code(404).send({ error: 'Not Found', message: error.message });
        }
        return reply.code(400).send({ error: 'Error', message: error.message });
      }
    },
  });

  /**
   * DELETE /permissions/roles/:id
   * Eliminar un rol personalizado
   */
  r.delete('/permissions/roles/:id', {
    preHandler: [app.authGuard, requirePermission('users.manage')],
    schema: {
      params: RoleIdParamsSchema,
      response: {
        200: z.object({ success: z.boolean() }),
        400: z.object({ error: z.string(), message: z.string() }),
        404: z.object({ error: z.string(), message: z.string() }),
      },
    },
    handler: async (req, reply) => {
      try {
        const user = getReqUser(req);
        const { id } = req.params;
        await svc.deleteRole(user.tenantId, id);
        return reply.code(200).send({ success: true });
      } catch (error: any) {
        if (error.message === 'Rol no encontrado') {
          return reply.code(404).send({ error: 'Not Found', message: error.message });
        }
        return reply.code(400).send({ error: 'Error', message: error.message });
      }
    },
  });

  /**
   * GET /permissions/all
   * Obtener lista de todos los permisos disponibles
   */
  r.get('/permissions/all', {
    preHandler: [app.authGuard, requirePermission('users.read')],
    schema: {
      response: {
        200: z.array(z.string()),
      },
    },
    handler: async (req, reply) => {
      const permissions = svc.listAllPermissions();
      return reply.code(200).send(permissions);
    },
  });

  /**
   * GET /permissions/me
   * Obtener los permisos efectivos del usuario actual
   */
  r.get('/permissions/me', {
    preHandler: app.authGuard,
    schema: {
      response: {
        200: z.object({
          role: z.string(),
          permissions: z.array(z.string()),
        }),
      },
    },
    handler: async (req, reply) => {
      const user = getReqUser(req);
      const permissions = await svc.getUserPermissions(user.tenantId, user.role);
      return reply.code(200).send({
        role: user.role,
        permissions,
      });
    },
  });
}
