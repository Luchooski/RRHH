import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  apiListNotifications,
  apiGetUnreadCount,
  apiMarkAsRead,
  apiMarkAllAsRead,
  apiDeleteNotification,
  apiDeleteAllRead,
} from './api';

export function useNotifications(params?: {
  read?: boolean;
  type?: string;
  limit?: number;
  skip?: number;
}) {
  return useQuery({
    queryKey: ['notifications', params ?? {}],
    queryFn: () => apiListNotifications(params),
    staleTime: 10_000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => apiGetUnreadCount(),
    staleTime: 10_000,
    refetchInterval: 30_000, // Poll every 30 seconds
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiMarkAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiMarkAllAsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDeleteNotification(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDeleteAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiDeleteAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
