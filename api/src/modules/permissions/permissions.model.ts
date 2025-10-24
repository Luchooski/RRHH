import mongoose, { Schema, Document } from 'mongoose';

// Módulos del sistema
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

// Acciones disponibles
export type Action =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'approve'
  | 'manage'
  | 'export'
  | 'import';

// Formato de permiso: module.action (ej: candidates.create, employees.read)
export type Permission = `${Module}.${Action}` | '*'; // * = todos los permisos

// Roles del sistema con sus permisos predefinidos
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: ['*'], // Todos los permisos

  hr: [
    // Candidatos - completo
    'candidates.create',
    'candidates.read',
    'candidates.update',
    'candidates.delete',

    // Empleados - completo
    'employees.create',
    'employees.read',
    'employees.update',
    'employees.delete',
    'employees.export',
    'employees.import',

    // Vacantes - completo
    'vacancies.create',
    'vacancies.read',
    'vacancies.update',
    'vacancies.delete',

    // Entrevistas - completo
    'interviews.create',
    'interviews.read',
    'interviews.update',
    'interviews.delete',

    // Licencias - gestión completa
    'leaves.create',
    'leaves.read',
    'leaves.update',
    'leaves.delete',
    'leaves.approve',

    // Asistencias - gestión completa
    'attendance.create',
    'attendance.read',
    'attendance.update',
    'attendance.delete',
    'attendance.manage',
    'attendance.export',

    // Liquidaciones - completo
    'payroll.create',
    'payroll.read',
    'payroll.update',
    'payroll.delete',
    'payroll.export',

    // Horarios - completo
    'schedules.create',
    'schedules.read',
    'schedules.update',
    'schedules.delete',

    // Clientes - completo
    'clients.create',
    'clients.read',
    'clients.update',
    'clients.delete',

    // Reportes - lectura
    'reports.read',
    'reports.export',

    // Auditoría - solo lectura
    'audit.read',
  ],

  employee: [
    // Candidatos - ninguno

    // Empleados - solo lectura de su propio perfil (controlado por lógica)
    'employees.read',

    // Licencias - crear y ver sus propias solicitudes
    'leaves.create',
    'leaves.read',

    // Asistencias - gestionar su propia asistencia
    'attendance.create',
    'attendance.read',

    // Liquidaciones - ver sus propios recibos
    'payroll.read',

    // Horarios - ver su propio horario
    'schedules.read',
  ],

  // Roles adicionales personalizables
  manager: [
    // Similar a HR pero sin permisos de delete en módulos críticos
    'candidates.create',
    'candidates.read',
    'candidates.update',

    'employees.read',
    'employees.update',

    'vacancies.create',
    'vacancies.read',
    'vacancies.update',

    'interviews.create',
    'interviews.read',
    'interviews.update',

    'leaves.read',
    'leaves.approve', // Puede aprobar licencias

    'attendance.read',
    'attendance.manage',

    'payroll.read',

    'schedules.read',
    'schedules.update',

    'clients.read',

    'reports.read',
    'reports.export',
  ],

  recruiter: [
    // Especializado en reclutamiento
    'candidates.create',
    'candidates.read',
    'candidates.update',
    'candidates.delete',

    'vacancies.create',
    'vacancies.read',
    'vacancies.update',

    'interviews.create',
    'interviews.read',
    'interviews.update',
    'interviews.delete',

    'clients.read', // Ver clientes para asignar vacantes
  ],
};

// Schema para roles personalizados
export interface IRole extends Document {
  tenantId: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isCustom: boolean; // true si es un rol personalizado del tenant
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    permissions: [{ type: String, required: true }],
    isCustom: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Índice único por tenant y nombre
RoleSchema.index({ tenantId: 1, name: 1 }, { unique: true });

export const Role = mongoose.model<IRole>('Role', RoleSchema);

// Helper para verificar si un usuario tiene un permiso
export function hasPermission(
  userRole: string,
  customPermissions: Permission[] = [],
  requiredPermission: Permission
): boolean {
  // Si tiene el permiso wildcard, tiene acceso a todo
  if (customPermissions.includes('*')) {
    return true;
  }

  // Verificar permisos personalizados del usuario
  if (customPermissions.includes(requiredPermission)) {
    return true;
  }

  // Verificar permisos del rol predefinido
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];

  if (rolePermissions.includes('*')) {
    return true;
  }

  if (rolePermissions.includes(requiredPermission)) {
    return true;
  }

  // Verificar permiso wildcard por módulo (ej: candidates.* permite cualquier acción en candidates)
  const [module] = requiredPermission.split('.') as [Module, Action];
  const moduleWildcard = `${module}.*` as Permission;

  if (customPermissions.includes(moduleWildcard) || rolePermissions.includes(moduleWildcard)) {
    return true;
  }

  return false;
}

// Helper para obtener todos los permisos efectivos de un usuario
export function getEffectivePermissions(
  userRole: string,
  customPermissions: Permission[] = []
): Permission[] {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  const allPermissions = [...rolePermissions, ...customPermissions];

  // Eliminar duplicados
  return Array.from(new Set(allPermissions));
}

// Lista completa de todos los permisos disponibles
export const ALL_PERMISSIONS: Permission[] = [
  // Candidates
  'candidates.create',
  'candidates.read',
  'candidates.update',
  'candidates.delete',

  // Employees
  'employees.create',
  'employees.read',
  'employees.update',
  'employees.delete',
  'employees.export',
  'employees.import',

  // Vacancies
  'vacancies.create',
  'vacancies.read',
  'vacancies.update',
  'vacancies.delete',

  // Interviews
  'interviews.create',
  'interviews.read',
  'interviews.update',
  'interviews.delete',

  // Leaves
  'leaves.create',
  'leaves.read',
  'leaves.update',
  'leaves.delete',
  'leaves.approve',

  // Attendance
  'attendance.create',
  'attendance.read',
  'attendance.update',
  'attendance.delete',
  'attendance.manage',
  'attendance.export',

  // Payroll
  'payroll.create',
  'payroll.read',
  'payroll.update',
  'payroll.delete',
  'payroll.export',

  // Schedules
  'schedules.create',
  'schedules.read',
  'schedules.update',
  'schedules.delete',

  // Clients
  'clients.create',
  'clients.read',
  'clients.update',
  'clients.delete',

  // Reports
  'reports.read',
  'reports.export',

  // Settings
  'settings.read',
  'settings.manage',

  // Users
  'users.create',
  'users.read',
  'users.update',
  'users.delete',
  'users.manage',

  // Audit
  'audit.read',
];
