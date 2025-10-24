import { useQuery } from '@tanstack/react-query';
import * as api from './api';
import type { TrendQueryParams } from './dto';

// Query Keys
export const analyticsKeys = {
  all: ['analytics'] as const,
  dashboard: () => [...analyticsKeys.all, 'dashboard'] as const,
  trends: () => [...analyticsKeys.all, 'trends'] as const,
  newHires: (params?: TrendQueryParams) => [...analyticsKeys.trends(), 'new-hires', params] as const,
  applications: (params?: TrendQueryParams) => [...analyticsKeys.trends(), 'applications', params] as const,
  attendance: (params?: TrendQueryParams) => [...analyticsKeys.trends(), 'attendance', params] as const,
};

/**
 * Hook para obtener los KPIs del dashboard
 */
export function useDashboardKPIs() {
  return useQuery({
    queryKey: analyticsKeys.dashboard(),
    queryFn: () => api.apiGetDashboardKPIs(),
    staleTime: 60_000, // 1 minute
    refetchInterval: 5 * 60_000, // Refetch every 5 minutes
  });
}

/**
 * Hook para obtener tendencia de nuevas contrataciones
 */
export function useNewHiresTrend(params?: TrendQueryParams) {
  return useQuery({
    queryKey: analyticsKeys.newHires(params),
    queryFn: () => api.apiGetNewHiresTrend(params),
    staleTime: 5 * 60_000, // 5 minutes
  });
}

/**
 * Hook para obtener tendencia de aplicaciones
 */
export function useApplicationsTrend(params?: TrendQueryParams) {
  return useQuery({
    queryKey: analyticsKeys.applications(params),
    queryFn: () => api.apiGetApplicationsTrend(params),
    staleTime: 5 * 60_000, // 5 minutes
  });
}

/**
 * Hook para obtener tendencia de asistencia
 */
export function useAttendanceTrend(params?: TrendQueryParams) {
  return useQuery({
    queryKey: analyticsKeys.attendance(params),
    queryFn: () => api.apiGetAttendanceTrend(params),
    staleTime: 2 * 60_000, // 2 minutes
  });
}
