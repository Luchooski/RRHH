import mongoose, { Schema, InferSchemaType, Model } from 'mongoose';

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: 'hr' },
  },
  { timestamps: true }
);

// Tipos fuertes
export type User = InferSchemaType<typeof UserSchema>;             // { email, passwordHash, role }
export type UserDoc = mongoose.Document & User;                    // documento hidratado

export const UserModel: Model<User> =
  (mongoose.models.User as Model<User>) || mongoose.model<User>('User', UserSchema);
