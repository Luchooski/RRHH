import { Schema, model, type Document } from 'mongoose';

export type ClientSize = 'small' | 'medium' | 'large';

export interface ClientDoc extends Document {
  tenantId: string;
  name: string;
  industry?: string;
  size: ClientSize;
  contactName: string;
  contactEmail: string;
  contactPhone?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<ClientDoc>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    industry: { type: String, trim: true },
    size: { type: String, enum: ['small', 'medium', 'large'], required: true },
    contactName: { type: String, required: true, trim: true },
    contactEmail: { type: String, required: true, trim: true, lowercase: true },
    contactPhone: { type: String, default: null, trim: true },
    notes: { type: String, default: null, trim: true },
  },
  { timestamps: true }
);

// Índices compuestos para queries por tenant
ClientSchema.index({ tenantId: 1, createdAt: -1 });
ClientSchema.index({ tenantId: 1, size: 1 });
ClientSchema.index({ name: 'text', industry: 'text', contactName: 'text', contactEmail: 'text' });

export const Client = model<ClientDoc>('Client', ClientSchema);
