import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../../config/env.js';
import { UserModel } from '../user/user.model.js';

type LoginArgs = { email: string; password: string };
type LoginResult = { token: string; user: { id: string; email: string; role: string } } | null;

export async function login({ email, password }: LoginArgs): Promise<LoginResult> {
  const user = await UserModel.findOne({ email }).lean(false).exec(); // lean(false) para tener doc si usás métodos
  if (!user) return null;

  // Detectar campo de hash flexible: passwordHash o password
  const hash: unknown = (user as any).passwordHash ?? (user as any).password;
  if (typeof hash !== 'string' || !hash) return null; // usuario mal cargado → tratar como credenciales inválidas

  const ok = await bcrypt.compare(password, hash);
  if (!ok) return null;

  const token = jwt.sign(
    { sub: String(user._id), email: user.email, role: (user as any).role ?? 'user' },
    env.jwtSecret || env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  return {
    token,
    user: { id: String(user._id), email: user.email, role: (user as any).role ?? 'user' },
  };
}

export async function ensureSeedAdmin() {
  const exists = await UserModel.findOne({ email: 'admin@demo.com' }).exec();
  if (!exists) {
    const hash = await bcrypt.hash('admin123', 10);
    await UserModel.create({ email: 'admin@demo.com', passwordHash: hash, role: 'admin' });
  }
}
