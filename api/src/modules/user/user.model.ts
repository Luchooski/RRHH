import mongoose, { Schema, InferSchemaType, Model } from 'mongoose';

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, default: 'hr', enum: ['superadmin', 'admin', 'hr', 'recruiter', 'employee'], index: true },
    tenantId: { type: String, required: true, index: true },
    refreshToken: { type: String, select: false }, // No se devuelve por defecto en queries
    refreshTokenExpiry: { type: Date, select: false },
    lastLogin: { type: Date },
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

// Índices compuestos para búsquedas eficientes
UserSchema.index({ tenantId: 1, email: 1 });
UserSchema.index({ tenantId: 1, role: 1 });

// Tipos fuertes
export type User = InferSchemaType<typeof UserSchema>;
export type UserDoc = mongoose.Document & User;

export const UserModel: Model<User> =
  (mongoose.models.User as Model<User>) || mongoose.model<User>('User', UserSchema);
