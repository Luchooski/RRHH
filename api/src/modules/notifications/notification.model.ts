import mongoose, { Schema, Model, Document } from 'mongoose';

/**
 * Enums/tipos que el service espera importar desde el model.
 * Exportamos explícitamente para resolver:
 * - "has no exported member 'NotificationType' | 'NotificationChannel' | 'NotificationPriority'"
 */
export enum NotificationType {
  GENERIC = 'generic',
  SYSTEM = 'system',
  REMINDER = 'reminder',
  WORKFLOW = 'workflow',
  MESSAGE = 'message',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
}

export interface INotification extends Document {
  tenantId: string;
  cycleId: string;
  evaluatedEmployeeId: string;
  timestamp: Date;
  expiresAt?: Date;
  /** Antes existía "type: string"; ahora tipamos con enum para consistencia */
  type: NotificationType;
  /** Nuevos campos tipados para coherencia con lo que suele usar el service */
  channel: NotificationChannel;
  priority: NotificationPriority;

  payload: Record<string, unknown>;
  read: boolean;

  createdAt: Date;
  updatedAt: Date;
}

// Importante: elegimos declarar índices SOLO con schema.index(...) para evitar duplicados
const NotificationSchema = new Schema<INotification>(
  {
    tenantId: { type: String, required: true },
    cycleId: { type: String, required: true },
    evaluatedEmployeeId: { type: String, required: true },

    timestamp: { type: Date, default: Date.now },
    expiresAt: { type: Date },

    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
      default: NotificationType.GENERIC,
    },
    channel: {
      type: String,
      enum: Object.values(NotificationChannel),
      required: true,
      default: NotificationChannel.IN_APP,
    },
    priority: {
      type: String,
      enum: Object.values(NotificationPriority),
      required: true,
      default: NotificationPriority.NORMAL,
    },

    payload: { type: Object, required: true },
    read: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Índices consolidados (sin usar "index: true" en los paths)
NotificationSchema.index({ tenantId: 1, cycleId: 1, evaluatedEmployeeId: 1 });
NotificationSchema.index({ timestamp: 1 });
// Si querés TTL, usá este índice (si no querés TTL, sacá la opción expireAfterSeconds)
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Anti OverwriteModelError
export const Notification: Model<INotification> =
  (mongoose.models.Notification as Model<INotification>) ||
  mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
