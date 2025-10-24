import { Role, IRole, Permission, ROLE_PERMISSIONS, getEffectivePermissions, ALL_PERMISSIONS } from './permissions.model.js';

export interface CreateRoleInput {
  name: string;
  description?: string;
  permissions: Permission[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  permissions?: Permission[];
}

/**
 * Crear un rol personalizado
 */
export async function createRole(tenantId: string, input: CreateRoleInput): Promise<IRole> {
  const { name, description, permissions } = input;

  // Validar que el nombre no sea de un rol predefinido
  if (ROLE_PERMISSIONS[name.toLowerCase()]) {
    throw new Error(`No puedes crear un rol con el nombre "${name}" porque es un rol predefinido del sistema`);
  }

  // Validar que todos los permisos sean válidos
  const invalidPermissions = permissions.filter(
    (perm) => perm !== '*' && !ALL_PERMISSIONS.includes(perm) && !perm.endsWith('.*')
  );

  if (invalidPermissions.length > 0) {
    throw new Error(`Permisos inválidos: ${invalidPermissions.join(', ')}`);
  }

  const role = await Role.create({
    tenantId,
    name,
    description,
    permissions,
    isCustom: true,
  });

  return role;
}

/**
 * Obtener todos los roles (predefinidos + personalizados del tenant)
 */
export async function listRoles(tenantId: string): Promise<any[]> {
  // Roles personalizados del tenant
  const customRoles = await Role.find({ tenantId }).lean();

  // Roles predefinidos del sistema
  const predefinedRoles = Object.keys(ROLE_PERMISSIONS).map((roleName) => ({
    name: roleName,
    description: getDefaultRoleDescription(roleName),
    permissions: ROLE_PERMISSIONS[roleName],
    isCustom: false,
  }));

  return [...predefinedRoles, ...customRoles];
}

/**
 * Obtener un rol específico
 */
export async function getRole(tenantId: string, roleName: string): Promise<any> {
  // Buscar en roles personalizados
  const customRole = await Role.findOne({ tenantId, name: roleName });
  if (customRole) {
    return customRole;
  }

  // Buscar en roles predefinidos
  if (ROLE_PERMISSIONS[roleName]) {
    return {
      name: roleName,
      description: getDefaultRoleDescription(roleName),
      permissions: ROLE_PERMISSIONS[roleName],
      isCustom: false,
    };
  }

  throw new Error('Rol no encontrado');
}

/**
 * Actualizar un rol personalizado
 */
export async function updateRole(
  tenantId: string,
  roleId: string,
  input: UpdateRoleInput
): Promise<IRole> {
  const role = await Role.findOne({ _id: roleId, tenantId });

  if (!role) {
    throw new Error('Rol no encontrado');
  }

  if (!role.isCustom) {
    throw new Error('No puedes editar roles predefinidos del sistema');
  }

  // Validar permisos si se están actualizando
  if (input.permissions) {
    const invalidPermissions = input.permissions.filter(
      (perm) => perm !== '*' && !ALL_PERMISSIONS.includes(perm) && !perm.endsWith('.*')
    );

    if (invalidPermissions.length > 0) {
      throw new Error(`Permisos inválidos: ${invalidPermissions.join(', ')}`);
    }
  }

  if (input.name !== undefined) role.name = input.name;
  if (input.description !== undefined) role.description = input.description;
  if (input.permissions !== undefined) role.permissions = input.permissions;

  await role.save();
  return role;
}

/**
 * Eliminar un rol personalizado
 */
export async function deleteRole(tenantId: string, roleId: string): Promise<void> {
  const role = await Role.findOne({ _id: roleId, tenantId });

  if (!role) {
    throw new Error('Rol no encontrado');
  }

  if (!role.isCustom) {
    throw new Error('No puedes eliminar roles predefinidos del sistema');
  }

  await role.deleteOne();
}

/**
 * Obtener todos los permisos disponibles
 */
export function listAllPermissions(): Permission[] {
  return ALL_PERMISSIONS;
}

/**
 * Obtener permisos efectivos de un usuario
 */
export async function getUserPermissions(
  tenantId: string,
  userRole: string,
  customPermissions?: Permission[]
): Promise<Permission[]> {
  // Si el rol es personalizado, obtener sus permisos
  if (!ROLE_PERMISSIONS[userRole]) {
    const customRole = await Role.findOne({ tenantId, name: userRole });
    if (customRole) {
      return getEffectivePermissions(userRole, customRole.permissions);
    }
  }

  // Rol predefinido
  return getEffectivePermissions(userRole, customPermissions);
}

// Helper para descripciones de roles predefinidos
function getDefaultRoleDescription(roleName: string): string {
  const descriptions: Record<string, string> = {
    admin: 'Administrador con acceso total al sistema',
    hr: 'Recursos Humanos - Gestión completa de empleados, candidatos y procesos',
    employee: 'Empleado - Acceso limitado a su información personal',
    manager: 'Gerente - Gestión de equipos y aprobaciones',
    recruiter: 'Reclutador - Gestión de candidatos y vacantes',
  };

  return descriptions[roleName] || 'Rol del sistema';
}
