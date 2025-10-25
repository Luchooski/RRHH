import mongoose, { Schema, Model } from 'mongoose';

export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'approve' | 'reject' | 'export' | 'import' | 'other';

export type AuditResource =
  | 'user'
  | 'employee'
  | 'candidate'
  | 'vacancy'
  | 'application'
  | 'interview'
  | 'payroll'
  | 'leave'
  | 'tenant'
  | 'attachment'
  | 'other';

interface IAuditLog {
  tenantId: string;
  userId: string;
  userName: string;

  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  resourceName?: string;

  changes?: object; // Diff de cambios (antes/después)
  metadata?: object; // Información adicional

  ipAddress?: string;
  userAgent?: string;

  timestamp: Date;
}

export type AuditLogDoc = IAuditLog & mongoose.Document;

const AuditLogSchema = new Schema<AuditLogDoc>({
  tenantId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  userName: { type: String, required: true },

  action: {
    type: String,
    required: true,
    enum: ['create', 'update', 'delete', 'login', 'logout', 'approve', 'reject', 'export', 'import', 'other'],
    index: true
  },
  resource: {
    type: String,
    required: true,
    enum: ['user', 'employee', 'candidate', 'vacancy', 'application', 'interview', 'payroll', 'leave', 'tenant', 'attachment', 'other'],
    index: true
  },
  resourceId: { type: String, index: true },
  resourceName: { type: String },

  changes: { type: Schema.Types.Mixed },
  metadata: { type: Schema.Types.Mixed },

  ipAddress: { type: String },
  userAgent: { type: String },

  timestamp: { type: Date, default: Date.now, index: true }
}, {
  timestamps: false, // Usamos timestamp manual
  capped: { size: 1024 * 1024 * 100, max: 100000 } // 100MB, max 100k docs (opcional)
});

// Índices compuestos para queries comunes
AuditLogSchema.index({ tenantId: 1, timestamp: -1 });
AuditLogSchema.index({ tenantId: 1, resource: 1, timestamp: -1 });
AuditLogSchema.index({ tenantId: 1, userId: 1, timestamp: -1 });
AuditLogSchema.index({ tenantId: 1, action: 1, timestamp: -1 });
AuditLogSchema.index({ resourceId: 1, timestamp: -1 });

// TTL index: auto-eliminar logs después de 1 año (opcional)
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

export const AuditLog = mongoose.model<AuditLogDoc>('AuditLog', AuditLogSchema);

/**
 * Helper para crear un log de auditoría
 */
export async function createAuditLog(data: {
  tenantId: string;
  userId: string;
  userName: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  resourceName?: string;
  changes?: object;
  metadata?: object;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await AuditLog.create({
      ...data,
      timestamp: new Date()
    });
  } catch (error) {
    // No bloquear operaciones si falla el audit log
    console.error('[AUDIT] Failed to create audit log:', error);
  }
}
