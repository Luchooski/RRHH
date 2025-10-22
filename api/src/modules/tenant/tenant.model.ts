import { Schema, model, Document } from 'mongoose';

export interface ITenant extends Document {
  _id: string;
  name: string;
  slug: string; // Unique identifier for public URLs (e.g., "acme-corp")
  email: string;
  status: 'active' | 'inactive' | 'suspended';
  plan: 'free' | 'basic' | 'professional' | 'enterprise';
  settings?: {
    maxUsers?: number;
    maxEmployees?: number;
    features?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const TenantSchema = new Schema<ITenant>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
      index: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, // kebab-case format
      minlength: 3,
      maxlength: 50
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
      index: true
    },
    plan: {
      type: String,
      enum: ['free', 'basic', 'professional', 'enterprise'],
      default: 'free',
      index: true
    },
    settings: {
      maxUsers: { type: Number, default: 5 },
      maxEmployees: { type: Number, default: 50 },
      features: [{ type: String }]
    }
  },
  {
    timestamps: true,
    collection: 'tenants'
  }
);

// Indexes para búsqueda eficiente
TenantSchema.index({ name: 'text', email: 'text' });

export const Tenant = model<ITenant>('Tenant', TenantSchema);
