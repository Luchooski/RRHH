import mongoose, { Schema, Model } from 'mongoose';

interface IPasswordReset {
  email: string;
  token: string;
  tenantId: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

const PasswordResetSchema = new Schema<IPasswordReset>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    used: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

// Index compuesto para búsquedas eficientes
PasswordResetSchema.index({ token: 1, used: 1, expiresAt: 1 });
PasswordResetSchema.index({ email: 1, createdAt: -1 });

// TTL index para auto-eliminar tokens expirados después de 24 horas
PasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });

export type PasswordResetDoc = IPasswordReset & mongoose.Document;

export const PasswordResetModel: Model<IPasswordReset> =
  (mongoose.models.PasswordReset as Model<IPasswordReset>) ||
  mongoose.model<IPasswordReset>('PasswordReset', PasswordResetSchema);
