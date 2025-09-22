import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel, type UserDoc } from '../user/user.model.js';
import type { LoginInput } from './auth.dto.js';
import { env } from '../../config/env.js';

export async function login(input: LoginInput) {
  // No usamos .lean() para tener tipos de doc hidratado
  const user: UserDoc | null = await UserModel.findOne({ email: input.email }).exec();
  if (!user) return null;

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) return null;

  const token = jwt.sign(
    { sub: String(user._id), role: user.role },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    token,
    user: { id: String(user._id), email: user.email, role: user.role },
  };
}

export async function ensureSeedAdmin() {
  const email = 'admin@demo.com';
  const pass = 'admin123'; // demo ONLY
  const exists = await UserModel.findOne({ email }).exec();
  if (exists) return;
  const hash = await bcrypt.hash(pass, 10);
  await UserModel.create({ email, passwordHash: hash, role: 'hr' });
  // eslint-disable-next-line no-console
  console.log(`[seed] user: ${email} / ${pass}`);
}
