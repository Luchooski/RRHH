// Tipos de RBAC

export type Module =
  | 'candidates'
  | 'employees'
  | 'vacancies'
  | 'interviews'
  | 'leaves'
  | 'attendance'
  | 'payroll'
  | 'schedules'
  | 'clients'
  | 'reports'
  | 'settings'
  | 'users'
  | 'audit';

export type Action =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'approve'
  | 'manage'
  | 'export'
  | 'import';

export type Permission = `${Module}.${Action}` | '*';

export interface Role {
  _id: string;
  tenantId: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
}

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

export interface UserPermissions {
  role: string;
  permissions: Permission[];
}

// Labels para Módulos
export const MODULE_LABELS: Record<Module, string> = {
  candidates: 'Candidatos',
  employees: 'Empleados',
  vacancies: 'Vacantes',
  interviews: 'Entrevistas',
  leaves: 'Licencias',
  attendance: 'Asistencias',
  payroll: 'Liquidaciones',
  schedules: 'Horarios',
  clients: 'Clientes',
  reports: 'Reportes',
  settings: 'Configuración',
  users: 'Usuarios',
  audit: 'Auditoría',
};

// Labels para Acciones
export const ACTION_LABELS: Record<Action, string> = {
  create: 'Crear',
  read: 'Leer',
  update: 'Actualizar',
  delete: 'Eliminar',
  approve: 'Aprobar',
  manage: 'Gestionar',
  export: 'Exportar',
  import: 'Importar',
};

// Labels para Roles Predefinidos
export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  hr: 'RRHH',
  employee: 'Empleado',
  manager: 'Manager',
  recruiter: 'Reclutador',
};

// Descripciones de Roles Predefinidos
export const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: 'Acceso completo a todas las funciones del sistema',
  hr: 'Gestión completa de recursos humanos y reclutamiento',
  employee: 'Acceso limitado a su perfil, licencias y asistencias',
  manager: 'Gestión de equipos, aprobación de licencias y reportes',
  recruiter: 'Especializado en reclutamiento y gestión de candidatos',
};

// Iconos para módulos
export const MODULE_ICONS: Record<Module, string> = {
  candidates: '👤',
  employees: '👥',
  vacancies: '💼',
  interviews: '📅',
  leaves: '🏖️',
  attendance: '📋',
  payroll: '💰',
  schedules: '⏰',
  clients: '🏢',
  reports: '📊',
  settings: '⚙️',
  users: '👨‍💼',
  audit: '🔍',
};

// Colores para roles
export const ROLE_COLORS: Record<string, string> = {
  admin: 'red',
  hr: 'blue',
  employee: 'gray',
  manager: 'purple',
  recruiter: 'green',
  custom: 'amber',
};

// Todos los permisos agrupados por módulo
export const PERMISSIONS_BY_MODULE: Record<Module, Permission[]> = {
  candidates: [
    'candidates.create',
    'candidates.read',
    'candidates.update',
    'candidates.delete',
  ],
  employees: [
    'employees.create',
    'employees.read',
    'employees.update',
    'employees.delete',
    'employees.export',
    'employees.import',
  ],
  vacancies: [
    'vacancies.create',
    'vacancies.read',
    'vacancies.update',
    'vacancies.delete',
  ],
  interviews: [
    'interviews.create',
    'interviews.read',
    'interviews.update',
    'interviews.delete',
  ],
  leaves: [
    'leaves.create',
    'leaves.read',
    'leaves.update',
    'leaves.delete',
    'leaves.approve',
  ],
  attendance: [
    'attendance.create',
    'attendance.read',
    'attendance.update',
    'attendance.delete',
    'attendance.manage',
    'attendance.export',
  ],
  payroll: [
    'payroll.create',
    'payroll.read',
    'payroll.update',
    'payroll.delete',
    'payroll.export',
  ],
  schedules: [
    'schedules.create',
    'schedules.read',
    'schedules.update',
    'schedules.delete',
  ],
  clients: [
    'clients.create',
    'clients.read',
    'clients.update',
    'clients.delete',
  ],
  reports: [
    'reports.read',
    'reports.export',
  ],
  settings: [
    'settings.read',
    'settings.manage',
  ],
  users: [
    'users.create',
    'users.read',
    'users.update',
    'users.delete',
    'users.manage',
  ],
  audit: [
    'audit.read',
  ],
};

// Helper para obtener el label de un permiso
export function getPermissionLabel(permission: Permission): string {
  if (permission === '*') return 'Todos los permisos';

  const [module, action] = permission.split('.') as [Module, Action];
  return `${MODULE_LABELS[module]} - ${ACTION_LABELS[action]}`;
}

// Helper para agrupar permisos por módulo
export function groupPermissionsByModule(permissions: Permission[]): Record<Module, Permission[]> {
  const grouped: Partial<Record<Module, Permission[]>> = {};

  permissions.forEach(permission => {
    if (permission === '*') return;

    const [module] = permission.split('.') as [Module, Action];
    if (!grouped[module]) {
      grouped[module] = [];
    }
    grouped[module]!.push(permission);
  });

  return grouped as Record<Module, Permission[]>;
}
