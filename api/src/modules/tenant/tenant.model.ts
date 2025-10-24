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
  branding?: {
    logo?: string; // URL to logo image
    primaryColor?: string; // Hex color code
    description?: string; // Company description for careers page
  };
  regional?: {
    language?: string; // 'es', 'en', 'pt', etc. (ISO 639-1)
    country?: string; // 'AR', 'US', 'BR', etc. (ISO 3166-1 alpha-2)
    timezone?: string; // IANA timezone (e.g., 'America/Argentina/Buenos_Aires')
    currency?: string; // Currency code (e.g., 'ARS', 'USD', 'EUR')
    dateFormat?: string; // 'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'
    timeFormat?: '12h' | '24h'; // 12-hour or 24-hour format
    firstDayOfWeek?: number; // 0 = Sunday, 1 = Monday, etc.
    numberFormat?: {
      decimalSeparator?: string; // '.' or ','
      thousandsSeparator?: string; // ',' or '.'
    };
  };
  policies?: {
    vacationDaysPerYear?: number; // Override default vacation calculation
    sickDaysPerYear?: number;
    workingHoursPerDay?: number; // Default working hours
    workingDaysPerWeek?: number; // Default working days
    overtimeMultiplier?: number; // Multiplier for overtime pay (e.g., 1.5)
    lateToleranceMinutes?: number; // Grace period for late arrival
    autoApproveLeaves?: boolean; // Auto-approve leave requests
  };
  analytics?: {
    totalApplications?: number;
    applicationsByCareersPage?: number;
    applicationsThisMonth?: number;
    lastApplicationDate?: Date;
    currentMonth?: number; // Mes actual (1-12) para detectar cambios de mes
    currentYear?: number;  // Año actual para detectar cambios de año
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
    },
    branding: {
      logo: { type: String },
      primaryColor: { type: String, match: /^#[0-9A-Fa-f]{6}$/ },
      description: { type: String, maxlength: 500 }
    },
    regional: {
      language: { type: String, default: 'es', match: /^[a-z]{2}$/ },
      country: { type: String, default: 'AR', match: /^[A-Z]{2}$/ },
      timezone: { type: String, default: 'America/Argentina/Buenos_Aires' },
      currency: { type: String, default: 'ARS', match: /^[A-Z]{3}$/ },
      dateFormat: { type: String, default: 'DD/MM/YYYY' },
      timeFormat: { type: String, enum: ['12h', '24h'], default: '24h' },
      firstDayOfWeek: { type: Number, min: 0, max: 6, default: 1 }, // Monday
      numberFormat: {
        decimalSeparator: { type: String, default: ',' },
        thousandsSeparator: { type: String, default: '.' }
      }
    },
    policies: {
      vacationDaysPerYear: { type: Number, min: 0, max: 365 },
      sickDaysPerYear: { type: Number, min: 0, max: 365 },
      workingHoursPerDay: { type: Number, default: 8, min: 1, max: 24 },
      workingDaysPerWeek: { type: Number, default: 5, min: 1, max: 7 },
      overtimeMultiplier: { type: Number, default: 1.5, min: 1.0, max: 3.0 },
      lateToleranceMinutes: { type: Number, default: 15, min: 0, max: 60 },
      autoApproveLeaves: { type: Boolean, default: false }
    },
    analytics: {
      totalApplications: { type: Number, default: 0 },
      applicationsByCareersPage: { type: Number, default: 0 },
      applicationsThisMonth: { type: Number, default: 0 },
      lastApplicationDate: { type: Date },
      currentMonth: { type: Number },
      currentYear: { type: Number }
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
