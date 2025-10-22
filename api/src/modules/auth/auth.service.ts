import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { env } from '../../config/env.js';
import { UserModel } from '../user/user.model.js';
import { isTenantActive } from '../tenant/tenant.service.js';
import { PasswordResetModel } from './password-reset.model.js';

type LoginArgs = { email: string; password: string };
type LoginResult = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; name: string; role: string; tenantId: string }
} | null;

type RefreshResult = {
  accessToken: string;
  refreshToken: string;
} | null;

export interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
}

/**
 * Genera un access token JWT
 */
function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(
    payload,
    env.jwtSecret || env.JWT_SECRET,
    { expiresIn: '15m' } // Access tokens cortos (15 minutos)
  );
}

/**
 * Genera un refresh token seguro
 */
function generateRefreshToken(): string {
  return randomBytes(64).toString('hex');
}

/**
 * Login: valida credenciales y genera tokens
 */
export async function login({ email, password }: LoginArgs): Promise<LoginResult> {
  const user = await UserModel.findOne({ email }).lean(false).exec();
  if (!user) return null;

  // Verificar que el usuario esté activo
  if (!(user as any).isActive) return null;

  // Verificar que el tenant esté activo
  const tenantActive = await isTenantActive((user as any).tenantId);
  if (!tenantActive) return null;

  // Detectar campo de hash flexible: passwordHash o password
  const hash: unknown = (user as any).passwordHash ?? (user as any).password;
  if (typeof hash !== 'string' || !hash) return null;

  const ok = await bcrypt.compare(password, hash);
  if (!ok) return null;

  // Generar tokens
  const payload: JWTPayload = {
    sub: String(user._id),
    email: user.email,
    name: (user as any).name ?? user.email,
    role: (user as any).role ?? 'user',
    tenantId: (user as any).tenantId
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken();

  // Guardar refresh token en la BD
  const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días
  await UserModel.findByIdAndUpdate(user._id, {
    refreshToken,
    refreshTokenExpiry,
    lastLogin: new Date()
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: String(user._id),
      email: user.email,
      name: (user as any).name ?? user.email,
      role: (user as any).role ?? 'user',
      tenantId: (user as any).tenantId
    },
  };
}

/**
 * Refresh: valida refresh token y genera nuevos tokens
 */
export async function refresh(refreshToken: string): Promise<RefreshResult> {
  const user = await UserModel.findOne({ refreshToken })
    .select('+refreshToken +refreshTokenExpiry')
    .lean(false)
    .exec();

  if (!user) return null;

  // Verificar que el refresh token no haya expirado
  if ((user as any).refreshTokenExpiry && new Date() > (user as any).refreshTokenExpiry) {
    // Token expirado, limpiarlo
    await UserModel.findByIdAndUpdate(user._id, {
      $unset: { refreshToken: '', refreshTokenExpiry: '' }
    });
    return null;
  }

  // Verificar que el usuario esté activo
  if (!(user as any).isActive) return null;

  // Verificar que el tenant esté activo
  const tenantActive = await isTenantActive((user as any).tenantId);
  if (!tenantActive) return null;

  // Generar nuevos tokens (rotación)
  const payload: JWTPayload = {
    sub: String(user._id),
    email: user.email,
    name: (user as any).name ?? user.email,
    role: (user as any).role ?? 'user',
    tenantId: (user as any).tenantId
  };

  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken();

  // Actualizar refresh token en la BD (rotación)
  const newRefreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await UserModel.findByIdAndUpdate(user._id, {
    refreshToken: newRefreshToken,
    refreshTokenExpiry: newRefreshTokenExpiry
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  };
}

/**
 * Logout: elimina refresh token
 */
export async function logout(userId: string): Promise<void> {
  await UserModel.findByIdAndUpdate(userId, {
    $unset: { refreshToken: '', refreshTokenExpiry: '' }
  });
}

/**
 * Seed admin user (solo para desarrollo/testing)
 * NOTA: En producción con multi-tenancy, esto debería eliminarse
 * o crear un tenant de demostración
 */
export async function ensureSeedAdmin() {
  const exists = await UserModel.findOne({ email: 'admin@demo.com' }).exec();
  if (!exists) {
    const hash = await bcrypt.hash('admin123', 10);
    // Crear un tenant demo si no existe
    const { Tenant } = await import('../tenant/tenant.model.js');
    let demoTenant = await Tenant.findOne({ email: 'demo@demo.com' });
    if (!demoTenant) {
      demoTenant = await Tenant.create({
        name: 'Demo Company',
        email: 'demo@demo.com',
        status: 'active',
        plan: 'free'
      });
    }
    await UserModel.create({
      email: 'admin@demo.com',
      passwordHash: hash,
      name: 'Admin Demo',
      role: 'admin',
      tenantId: demoTenant._id.toString()
    });
  }
}

/**
 * Forgot Password: genera token de recuperación y retorna info para enviar email
 */
export async function forgotPassword(email: string): Promise<{
  token: string;
  user: { name: string; email: string };
} | null> {
  // Buscar usuario por email
  const user = await UserModel.findOne({ email: email.toLowerCase().trim() }).lean();
  if (!user) {
    // Por seguridad, no revelamos si el email existe o no
    // Retornamos null silenciosamente
    return null;
  }

  // Verificar que el usuario esté activo
  if (!(user as any).isActive) return null;

  // Verificar que el tenant esté activo
  const tenantActive = await isTenantActive((user as any).tenantId);
  if (!tenantActive) return null;

  // Generar token seguro de 32 bytes (64 caracteres hex)
  const token = randomBytes(32).toString('hex');

  // Token válido por 1 hora
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  // Invalidar tokens anteriores del mismo usuario
  await PasswordResetModel.updateMany(
    { email: email.toLowerCase().trim(), used: false },
    { $set: { used: true } }
  );

  // Crear nuevo token de recuperación
  await PasswordResetModel.create({
    email: email.toLowerCase().trim(),
    token,
    tenantId: (user as any).tenantId,
    expiresAt,
    used: false
  });

  return {
    token,
    user: {
      name: (user as any).name ?? user.email,
      email: user.email
    }
  };
}

/**
 * Reset Password: valida token y actualiza contraseña
 */
export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  // Buscar token válido
  const resetToken = await PasswordResetModel.findOne({
    token,
    used: false,
    expiresAt: { $gt: new Date() } // No expirado
  }).lean();

  if (!resetToken) {
    return false; // Token inválido o expirado
  }

  // Buscar usuario
  const user = await UserModel.findOne({ email: resetToken.email });
  if (!user) {
    return false;
  }

  // Hash de nueva contraseña
  const hash = await bcrypt.hash(newPassword, 10);

  // Actualizar contraseña
  await UserModel.findByIdAndUpdate(user._id, {
    passwordHash: hash,
    // Invalidar todos los refresh tokens (cerrar sesiones activas)
    $unset: { refreshToken: '', refreshTokenExpiry: '' }
  });

  // Marcar token como usado
  await PasswordResetModel.findByIdAndUpdate(resetToken._id, {
    used: true
  });

  return true;
}
