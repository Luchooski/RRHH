import { FastifyRequest, FastifyReply } from 'fastify';
import { hasPermission, Permission, Role } from './permissions.model';

// Extender el tipo de usuario para incluir permisos personalizados
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: string;
      tenantId: string;
      permissions?: Permission[]; // Permisos personalizados del usuario
    };
  }
}

/**
 * Middleware para verificar si el usuario tiene un permiso específico
 * Uso: { preHandler: requirePermission('candidates.create') }
 */
export function requirePermission(requiredPermission: Permission) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.user;

    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized', message: 'Usuario no autenticado' });
    }

    // Obtener permisos personalizados del usuario si tiene un rol custom
    let customPermissions: Permission[] = user.permissions || [];

    // Si el usuario tiene un rol personalizado, obtener sus permisos
    if (user.role && !['admin', 'hr', 'employee', 'manager', 'recruiter'].includes(user.role)) {
      const customRole = await Role.findOne({ tenantId: user.tenantId, name: user.role });
      if (customRole) {
        customPermissions = customRole.permissions;
      }
    }

    // Verificar si tiene el permiso requerido
    const authorized = hasPermission(user.role, customPermissions, requiredPermission);

    if (!authorized) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: `No tienes permiso para realizar esta acción. Requiere: ${requiredPermission}`,
      });
    }

    // Usuario autorizado, continuar
  };
}

/**
 * Middleware para verificar si el usuario tiene AL MENOS UNO de los permisos especificados
 * Uso: { preHandler: requireAnyPermission(['candidates.read', 'candidates.create']) }
 */
export function requireAnyPermission(requiredPermissions: Permission[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.user;

    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized', message: 'Usuario no autenticado' });
    }

    // Obtener permisos personalizados
    let customPermissions: Permission[] = user.permissions || [];

    if (user.role && !['admin', 'hr', 'employee', 'manager', 'recruiter'].includes(user.role)) {
      const customRole = await Role.findOne({ tenantId: user.tenantId, name: user.role });
      if (customRole) {
        customPermissions = customRole.permissions;
      }
    }

    // Verificar si tiene al menos uno de los permisos
    const authorized = requiredPermissions.some((perm) =>
      hasPermission(user.role, customPermissions, perm)
    );

    if (!authorized) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: `No tienes permiso para realizar esta acción. Requiere uno de: ${requiredPermissions.join(', ')}`,
      });
    }
  };
}

/**
 * Middleware para verificar si el usuario tiene TODOS los permisos especificados
 * Uso: { preHandler: requireAllPermissions(['candidates.read', 'candidates.update']) }
 */
export function requireAllPermissions(requiredPermissions: Permission[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.user;

    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized', message: 'Usuario no autenticado' });
    }

    // Obtener permisos personalizados
    let customPermissions: Permission[] = user.permissions || [];

    if (user.role && !['admin', 'hr', 'employee', 'manager', 'recruiter'].includes(user.role)) {
      const customRole = await Role.findOne({ tenantId: user.tenantId, name: user.role });
      if (customRole) {
        customPermissions = customRole.permissions;
      }
    }

    // Verificar si tiene todos los permisos
    const authorized = requiredPermissions.every((perm) =>
      hasPermission(user.role, customPermissions, perm)
    );

    if (!authorized) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: `No tienes permiso para realizar esta acción. Requiere todos: ${requiredPermissions.join(', ')}`,
      });
    }
  };
}

/**
 * Helper para verificar permisos en el código (no middleware)
 * Útil para lógica condicional dentro de los handlers
 */
export async function checkPermission(
  user: FastifyRequest['user'],
  requiredPermission: Permission
): Promise<boolean> {
  if (!user) return false;

  let customPermissions: Permission[] = user.permissions || [];

  if (user.role && !['admin', 'hr', 'employee', 'manager', 'recruiter'].includes(user.role)) {
    const customRole = await Role.findOne({ tenantId: user.tenantId, name: user.role });
    if (customRole) {
      customPermissions = customRole.permissions;
    }
  }

  return hasPermission(user.role, customPermissions, requiredPermission);
}
