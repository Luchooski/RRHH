import { http } from '../../lib/http';
import type { DashboardKPIs, TrendDataPoint, TrendQueryParams } from './dto';

/**
 * Obtener todos los KPIs del dashboard
 */
export async function apiGetDashboardKPIs() {
  return http.get<DashboardKPIs>('/api/v1/analytics/dashboard', { auth: true });
}

/**
 * Obtener tendencia de nuevas contrataciones
 */
export async function apiGetNewHiresTrend(params?: TrendQueryParams) {
  const queryParams = new URLSearchParams();
  if (params?.months) queryParams.append('months', params.months.toString());

  const url = `/api/v1/analytics/trends/new-hires${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  return http.get<TrendDataPoint[]>(url, { auth: true });
}

/**
 * Obtener tendencia de aplicaciones
 */
export async function apiGetApplicationsTrend(params?: TrendQueryParams) {
  const queryParams = new URLSearchParams();
  if (params?.months) queryParams.append('months', params.months.toString());

  const url = `/api/v1/analytics/trends/applications${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  return http.get<TrendDataPoint[]>(url, { auth: true });
}

/**
 * Obtener tendencia de asistencia
 */
export async function apiGetAttendanceTrend(params?: TrendQueryParams) {
  const queryParams = new URLSearchParams();
  if (params?.days) queryParams.append('days', params.days.toString());

  const url = `/api/v1/analytics/trends/attendance${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  return http.get<TrendDataPoint[]>(url, { auth: true });
}
