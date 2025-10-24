// Notification DTOs

export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationChannel = 'in-app' | 'email' | 'push' | 'sms';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  _id: string;
  tenantId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  type: NotificationType;
  channels: NotificationChannel[];
  priority: NotificationPriority;
  title: string;
  message: string;
  category: string;
  actionUrl?: string;
  actionLabel?: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  sentAt?: string;
  emailSent?: boolean;
  emailSentAt?: string;
  pushSent?: boolean;
  pushSentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  byCategory: Record<string, number>;
}

// Workflow DTOs

export type WorkflowStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled' | 'failed';
export type WorkflowType = 'leave-approval' | 'evaluation-review' | 'benefit-enrollment' | 'document-approval' | 'custom';

export interface WorkflowStep {
  stepId: string;
  name: string;
  assignedTo: string;
  assignedToName: string;
  assignedToRole?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'rejected' | 'skipped';
  dueDate?: string;
  completedAt?: string;
  completedBy?: string;
  completedByName?: string;
  comments?: string;
  data?: Record<string, any>;
  notificationSent?: boolean;
  remindersSent?: number;
}

export interface Workflow {
  _id: string;
  tenantId: string;
  type: WorkflowType;
  name: string;
  description?: string;
  resourceType: string;
  resourceId: string;
  resourceData?: Record<string, any>;
  requestedBy: string;
  requestedByName: string;
  status: WorkflowStatus;
  currentStepIndex: number;
  steps: WorkflowStep[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  startedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  pendingTasks: number;
}
