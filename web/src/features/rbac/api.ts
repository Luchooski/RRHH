import { http } from '../../lib/http';
import type { Role, CreateRoleInput, UpdateRoleInput, Permission, UserPermissions } from './dto';

/**
 * Listar todos los roles (predefinidos + personalizados)
 */
export async function apiListRoles() {
  return http.get<Role[]>('/api/v1/permissions/roles', { auth: true });
}

/**
 * Obtener un rol específico por nombre
 */
export async function apiGetRole(name: string) {
  return http.get<Role>(`/api/v1/permissions/roles/${encodeURIComponent(name)}`, { auth: true });
}

/**
 * Crear un rol personalizado
 */
export async function apiCreateRole(input: CreateRoleInput) {
  return http.post<Role>('/api/v1/permissions/roles', input, { auth: true });
}

/**
 * Actualizar un rol personalizado
 */
export async function apiUpdateRole(id: string, input: UpdateRoleInput) {
  return http.put<Role>(`/api/v1/permissions/roles/${id}`, input, { auth: true });
}

/**
 * Eliminar un rol personalizado
 */
export async function apiDeleteRole(id: string) {
  return http.delete<{ success: boolean }>(`/api/v1/permissions/roles/${id}`, { auth: true });
}

/**
 * Obtener lista de todos los permisos disponibles
 */
export async function apiListAllPermissions() {
  return http.get<Permission[]>('/api/v1/permissions/all', { auth: true });
}

/**
 * Obtener los permisos efectivos del usuario actual
 */
export async function apiGetMyPermissions() {
  return http.get<UserPermissions>('/api/v1/permissions/me', { auth: true });
}
