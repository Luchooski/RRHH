import mongoose, { Schema, Model } from 'mongoose';

export type NotificationType =
  | 'info'          // Información general
  | 'success'       // Operación exitosa
  | 'warning'       // Advertencia
  | 'error'         // Error
  | 'leave_request' // Nueva solicitud de licencia
  | 'leave_approved' // Licencia aprobada
  | 'leave_rejected' // Licencia rechazada
  | 'new_application' // Nueva aplicación de candidato
  | 'interview_scheduled' // Entrevista programada
  | 'payroll_ready' // Liquidación lista
  | 'other';

interface INotification {
  tenantId: string;
  userId: string;        // Usuario destinatario
  userName: string;

  type: NotificationType;
  title: string;
  message: string;

  // Metadata para acciones
  actionUrl?: string;    // URL a la que navegar al hacer clic
  actionLabel?: string;  // Texto del botón de acción (ej: "Ver detalles")

  // Relación con recurso
  resourceType?: string; // 'leave', 'candidate', 'payroll', etc.
  resourceId?: string;   // ID del recurso relacionado

  // Estado
  read: boolean;
  readAt?: Date;

  // Metadata adicional
  metadata?: object;

  createdAt: Date;
  updatedAt: Date;
}

export type NotificationDoc = INotification & mongoose.Document & { id: string };

const NotificationSchema = new Schema<NotificationDoc>({
  tenantId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  userName: { type: String, required: true },

  type: {
    type: String,
    required: true,
    enum: [
      'info',
      'success',
      'warning',
      'error',
      'leave_request',
      'leave_approved',
      'leave_rejected',
      'new_application',
      'interview_scheduled',
      'payroll_ready',
      'other'
    ],
    default: 'info'
  },
  title: { type: String, required: true },
  message: { type: String, required: true },

  actionUrl: { type: String },
  actionLabel: { type: String },

  resourceType: { type: String },
  resourceId: { type: String },

  read: { type: Boolean, default: false, index: true },
  readAt: { type: Date },

  metadata: { type: Schema.Types.Mixed }
}, {
  timestamps: true
});

// Índices compuestos para queries eficientes
NotificationSchema.index({ tenantId: 1, userId: 1, createdAt: -1 });
NotificationSchema.index({ tenantId: 1, userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 }); // Para contador de no leídas

// TTL index: auto-eliminar notificaciones después de 90 días
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Virtual para ID
NotificationSchema.virtual('id').get(function (this: { _id: mongoose.Types.ObjectId }) {
  return this._id?.toString();
});

// Transform
const transform = (_doc: any, ret: any) => {
  ret.id = ret.id ?? ret._id?.toString();
  delete ret._id;
  return ret;
};

NotificationSchema.set('toJSON', { virtuals: true, transform });
NotificationSchema.set('toObject', { virtuals: true, transform });

export const Notification = mongoose.model<NotificationDoc>('Notification', NotificationSchema);

/**
 * Helper para crear una notificación
 */
export async function createNotification(data: {
  tenantId: string;
  userId: string;
  userName: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: object;
}): Promise<NotificationDoc> {
  const notification = await Notification.create(data);
  return notification;
}

/**
 * Helper para crear múltiples notificaciones a varios usuarios
 */
export async function createBulkNotifications(
  users: Array<{ userId: string; userName: string }>,
  data: {
    tenantId: string;
    type: NotificationType;
    title: string;
    message: string;
    actionUrl?: string;
    actionLabel?: string;
    resourceType?: string;
    resourceId?: string;
    metadata?: object;
  }
): Promise<void> {
  const notifications = users.map(user => ({
    ...data,
    userId: user.userId,
    userName: user.userName
  }));

  await Notification.insertMany(notifications);
}
