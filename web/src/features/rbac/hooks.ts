import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from './api';
import type { CreateRoleInput, UpdateRoleInput } from './dto';

// Query Keys
export const rbacKeys = {
  all: ['rbac'] as const,
  roles: () => [...rbacKeys.all, 'roles'] as const,
  role: (name: string) => [...rbacKeys.all, 'role', name] as const,
  permissions: () => [...rbacKeys.all, 'permissions'] as const,
  myPermissions: () => [...rbacKeys.all, 'my-permissions'] as const,
};

/**
 * Hook para listar todos los roles
 */
export function useRoles() {
  return useQuery({
    queryKey: rbacKeys.roles(),
    queryFn: () => api.apiListRoles(),
    staleTime: 2 * 60_000, // 2 minutes
  });
}

/**
 * Hook para obtener un rol específico por nombre
 */
export function useRole(name: string) {
  return useQuery({
    queryKey: rbacKeys.role(name),
    queryFn: () => api.apiGetRole(name),
    enabled: !!name,
    staleTime: 2 * 60_000,
  });
}

/**
 * Hook para listar todos los permisos disponibles
 */
export function useAllPermissions() {
  return useQuery({
    queryKey: rbacKeys.permissions(),
    queryFn: () => api.apiListAllPermissions(),
    staleTime: 5 * 60_000, // 5 minutes (permisos no cambian frecuentemente)
  });
}

/**
 * Hook para obtener los permisos del usuario actual
 */
export function useMyPermissions() {
  return useQuery({
    queryKey: rbacKeys.myPermissions(),
    queryFn: () => api.apiGetMyPermissions(),
    staleTime: 60_000, // 1 minute
  });
}

/**
 * Hook para crear un rol personalizado
 */
export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRoleInput) => api.apiCreateRole(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles() });
    },
  });
}

/**
 * Hook para actualizar un rol personalizado
 */
export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRoleInput }) =>
      api.apiUpdateRole(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles() });
      queryClient.invalidateQueries({ queryKey: rbacKeys.role(data.name) });
    },
  });
}

/**
 * Hook para eliminar un rol personalizado
 */
export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.apiDeleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles() });
    },
  });
}
