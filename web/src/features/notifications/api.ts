import { http } from '@/lib/api';
import type {
  Notification,
  NotificationStats,
  Workflow,
  WorkflowStats,
  CompleteStepDto,
  RejectStepDto,
  CancelWorkflowDto,
} from './dto';

const BASE = '/api/v1';

// =============== NOTIFICATIONS ===============

export async function getNotifications(params?: {
  isRead?: boolean;
  category?: string;
  limit?: number;
  skip?: number;
}): Promise<{
  notifications: Notification[];
  total: number;
  limit: number;
  skip: number;
}> {
  return http.get(`${BASE}/notifications`, { auth: true, params });
}

export async function getNotificationStats(): Promise<NotificationStats> {
  return http.get(`${BASE}/notifications/stats`, { auth: true });
}

export async function markNotificationAsRead(id: string): Promise<Notification> {
  return http.patch(`${BASE}/notifications/${id}/read`, {}, { auth: true });
}

export async function markAllAsRead(): Promise<{ success: boolean; modifiedCount: number }> {
  return http.patch(`${BASE}/notifications/read-all`, {}, { auth: true });
}

export async function deleteNotification(id: string): Promise<{ success: boolean }> {
  return http.delete(`${BASE}/notifications/${id}`, { auth: true });
}

// =============== WORKFLOWS ===============

export async function getPendingWorkflows(params?: {
  limit?: number;
  skip?: number;
}): Promise<{
  workflows: Workflow[];
  total: number;
}> {
  return http.get(`${BASE}/workflows/pending`, { auth: true, params });
}

export async function getCreatedWorkflows(params?: {
  status?: string;
  limit?: number;
  skip?: number;
}): Promise<{
  workflows: Workflow[];
  total: number;
}> {
  return http.get(`${BASE}/workflows/created`, { auth: true, params });
}

export async function getWorkflow(id: string): Promise<Workflow> {
  return http.get(`${BASE}/workflows/${id}`, { auth: true });
}

export async function getWorkflowStats(): Promise<WorkflowStats> {
  return http.get(`${BASE}/workflows/stats`, { auth: true });
}

export async function completeWorkflowStep(
  workflowId: string,
  stepId: string,
  data: CompleteStepDto
): Promise<Workflow> {
  return http.post(`${BASE}/workflows/${workflowId}/steps/${stepId}/complete`, data, { auth: true });
}

export async function rejectWorkflowStep(
  workflowId: string,
  stepId: string,
  data: RejectStepDto
): Promise<Workflow> {
  return http.post(`${BASE}/workflows/${workflowId}/steps/${stepId}/reject`, data, { auth: true });
}

export async function cancelWorkflow(
  id: string,
  data: CancelWorkflowDto
): Promise<Workflow> {
  return http.post(`${BASE}/workflows/${id}/cancel`, data, { auth: true });
}
