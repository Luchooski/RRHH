// api/src/modules/notifications/notification.model.ts
import mongoose, { Schema, Model, Document } from 'mongoose';

export interface INotification extends Document {
  tenantId: string;
  cycleId: string;
  evaluatedEmployeeId: string;
  timestamp: Date;
  expiresAt?: Date;
  type: string;
  payload: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Nota importante sobre índices:
// Elegimos declarar TODOS los índices usando schema.index(...)
// y NO usamos "index: true" en los paths para evitar duplicidad.

const NotificationSchema = new Schema<INotification>(
  {
    tenantId: { type: String, required: true },
    cycleId: { type: String, required: true },
    evaluatedEmployeeId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    type: { type: String, required: true },
    payload: { type: Object, required: true },
    read: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Definimos índices SOLO acá (sin "index: true" en los paths)
NotificationSchema.index({ tenantId: 1, cycleId: 1, evaluatedEmployeeId: 1 });
NotificationSchema.index({ timestamp: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); 
// ^ Si tu intención era TTL (fecha exacta en expiresAt). Si NO usás TTL, quitá "expireAfterSeconds".

// Anti OverwriteModelError (ESM + hot reload/monorepo)
export const Notification: Model<INotification> =
  (mongoose.models.Notification as Model<INotification>) ||
  mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
