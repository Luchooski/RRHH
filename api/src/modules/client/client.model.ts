import { Schema, model, type Document } from 'mongoose';

export type ClientSize = 'small' | 'medium' | 'large';

export interface ClientDoc extends Document {
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

// Índices útiles
ClientSchema.index({ name: 'text', industry: 'text', contactName: 'text', contactEmail: 'text' });
ClientSchema.index({ createdAt: -1 });

export const Client = model<ClientDoc>('Client', ClientSchema);
