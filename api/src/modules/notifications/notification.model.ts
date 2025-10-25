import { Schema, type HydratedDocument, type Model } from 'mongoose';
import { getConnection } from '../../config/db.js';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationChannel = 'in-app' | 'email' | 'push' | 'sms';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface INotification {
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
  readAt?: Date;
  sentAt?: Date;
  emailSent?: boolean;
  emailSentAt?: Date;
  pushSent?: boolean;
  pushSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationDoc = HydratedDocument<INotification>;

const NotificationSchema = new Schema<INotification>(
  {
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userEmail: { type: String },
    type: { type: String, enum: ['info','success','warning','error'], default: 'info' },
    channels: [{ type: String, enum: ['in-app','email','push','sms'] }],
    priority: { type: String, enum: ['low','normal','high','urgent'], default: 'normal' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    category: { type: String, required: true, index: true },
    actionUrl: { type: String },
    actionLabel: { type: String },
    data: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    sentAt: { type: Date },
    emailSent: { type: Boolean, default: false },
    emailSentAt: { type: Date },
    pushSent: { type: Boolean, default: false },
    pushSentAt: { type: Date }
  },
  { timestamps: true }
);

NotificationSchema.index({ tenantId: 1, userId: 1, isRead: 1 });
NotificationSchema.index({ tenantId: 1, userId: 1, createdAt: -1 });
NotificationSchema.index({ tenantId: 1, category: 1, createdAt: -1 });

declare global {
  // eslint-disable-next-line no-var
  var _NotificationModel: Model<INotification> | undefined;
}

export function getNotificationModel(): Model<INotification> {
  if (global._NotificationModel) return global._NotificationModel;
  const conn = getConnection();
  global._NotificationModel =
    (conn.models.Notification as Model<INotification>) ||
    conn.model<INotification>('Notification', NotificationSchema);
  return global._NotificationModel;
}
