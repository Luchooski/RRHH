import { http } from '@/lib/http';
import type { Notification, NotificationListOut } from './dto';

export async function apiListNotifications(params?: {
  read?: boolean;
  type?: string;
  limit?: number;
  skip?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.read !== undefined) qs.set('read', String(params.read));
  if (params?.type) qs.set('type', params.type);
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.skip) qs.set('skip', String(params.skip));

  const q = qs.toString() ? `?${qs.toString()}` : '';
  const raw = await http.get<any>(`/api/v1/notifications${q}`, { auth: true });

  if (Array.isArray(raw)) {
    return { items: raw, total: raw.length } as NotificationListOut;
  }
  return (raw ?? { items: [], total: 0 }) as NotificationListOut;
}

export async function apiGetUnreadCount() {
  const res = await http.get<{ count: number }>('/api/v1/notifications/unread-count', { auth: true });
  return res.count || 0;
}

export async function apiMarkAsRead(id: string) {
  return http.patch<Notification>(`/api/v1/notifications/${encodeURIComponent(id)}/read`, undefined, { auth: true });
}

export async function apiMarkAllAsRead() {
  return http.post<{ ok: boolean }>('/api/v1/notifications/mark-all-read', undefined, { auth: true });
}

export async function apiDeleteNotification(id: string) {
  return http.delete<{ ok: boolean }>(`/api/v1/notifications/${encodeURIComponent(id)}`, { auth: true });
}

export async function apiDeleteAllRead() {
  return http.delete<{ ok: boolean }>('/api/v1/notifications', { auth: true });
}
