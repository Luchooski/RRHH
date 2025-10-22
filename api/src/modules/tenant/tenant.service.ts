import { Tenant, ITenant } from './tenant.model.js';
import { UserModel } from '../user/user.model.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import type { CreateTenantInput, UpdateTenantInput, TenantOutput } from './tenant.dto.js';

/**
 * Genera un slug único basado en el nombre de la empresa
 */
async function generateUniqueSlug(name: string): Promise<string> {
  // Convertir nombre a slug: "Acme Corp" -> "acme-corp"
  let baseSlug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
    .trim()
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-'); // Múltiples guiones a uno solo

  // Si el slug está vacío, usar un valor por defecto
  if (!baseSlug) {
    baseSlug = 'company';
  }

  // Verificar si el slug ya existe y agregar sufijo numérico si es necesario
  let slug = baseSlug;
  let counter = 1;

  while (await Tenant.findOne({ slug }).lean()) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Mapper de documento Mongoose a DTO de salida
 */
function mapToOutput(doc: ITenant): TenantOutput {
  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    email: doc.email,
    status: doc.status,
    plan: doc.plan,
    settings: doc.settings,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString()
  };
}

/**
 * Crea un nuevo tenant junto con su usuario administrador
 * Usa transacción para garantizar atomicidad
 */
export async function createTenant(input: CreateTenantInput): Promise<{ tenant: TenantOutput; userId: string }> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Verificar que el email del tenant no exista
    const existingTenant = await Tenant.findOne({ email: input.email }).session(session);
    if (existingTenant) {
      throw new Error('TENANT_EMAIL_EXISTS');
    }

    // Verificar que el email del usuario no exista
    const existingUser = await UserModel.findOne({ email: input.adminUser.email }).session(session);
    if (existingUser) {
      throw new Error('USER_EMAIL_EXISTS');
    }

    // Generar slug único
    const slug = await generateUniqueSlug(input.name);

    // Crear tenant
    const [tenant] = await Tenant.create(
      [
        {
          name: input.name,
          slug,
          email: input.email,
          plan: input.plan,
          status: 'active'
        }
      ],
      { session }
    );

    // Hashear password del admin
    const passwordHash = await bcrypt.hash(input.adminUser.password, 10);

    // Crear usuario admin
    const [adminUser] = await UserModel.create(
      [
        {
          email: input.adminUser.email,
          passwordHash,
          name: input.adminUser.name,
          role: 'admin',
          tenantId: tenant._id.toString()
        }
      ],
      { session }
    );

    await session.commitTransaction();

    return {
      tenant: mapToOutput(tenant),
      userId: adminUser._id.toString()
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Obtiene un tenant por ID
 */
export async function getTenantById(tenantId: string): Promise<TenantOutput | null> {
  const tenant = await Tenant.findById(tenantId).lean();
  if (!tenant) return null;
  return mapToOutput(tenant as ITenant);
}

/**
 * Obtiene un tenant por email
 */
export async function getTenantByEmail(email: string): Promise<TenantOutput | null> {
  const tenant = await Tenant.findOne({ email }).lean();
  if (!tenant) return null;
  return mapToOutput(tenant as ITenant);
}

/**
 * Actualiza un tenant
 */
export async function updateTenant(tenantId: string, input: UpdateTenantInput): Promise<TenantOutput | null> {
  const tenant = await Tenant.findByIdAndUpdate(tenantId, { $set: input }, { new: true, runValidators: true }).lean();
  if (!tenant) return null;
  return mapToOutput(tenant as ITenant);
}

/**
 * Lista todos los tenants (para admin global)
 */
export async function listTenants(filters?: {
  status?: string;
  plan?: string;
  search?: string;
}): Promise<TenantOutput[]> {
  const query: any = {};

  if (filters?.status) {
    query.status = filters.status;
  }

  if (filters?.plan) {
    query.plan = filters.plan;
  }

  if (filters?.search) {
    query.$text = { $search: filters.search };
  }

  const tenants = await Tenant.find(query).sort({ createdAt: -1 }).limit(100).lean();

  return tenants.map((t) => mapToOutput(t as ITenant));
}

/**
 * Verifica si un tenant está activo
 */
export async function isTenantActive(tenantId: string): Promise<boolean> {
  const tenant = await Tenant.findById(tenantId).select('status').lean();
  return tenant?.status === 'active';
}
