export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'leave_request'
  | 'leave_approved'
  | 'leave_rejected'
  | 'new_application'
  | 'interview_scheduled'
  | 'payroll_ready'
  | 'other';

export type Notification = {
  id: string;
  tenantId: string;
  userId: string;
  userName?: string;

  type: NotificationType;
  title: string;
  message: string;

  actionUrl?: string;
  actionLabel?: string;

  resourceType?: string;
  resourceId?: string;

  read: boolean;
  readAt?: string;

  metadata?: Record<string, any>;

  createdAt: string;
  updatedAt: string;
};

export type NotificationListOut = {
  items: Notification[];
  total: number;
};
