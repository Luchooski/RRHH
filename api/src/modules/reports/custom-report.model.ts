import { Schema, model, Document } from 'mongoose';

export interface ICustomReport {
  tenantId: string;
  name: string;
  description?: string;
  reportType: 'attendance' | 'leaves' | 'employees' | 'payroll';

  // Configuration
  fields: string[]; // Array of field names to include
  filters: {
    dateRange?: {
      from: string;
      to: string;
    };
    employeeId?: string;
    department?: string;
    status?: string;
    groupBy?: string;
    [key: string]: any;
  };
  sortBy?: {
    field: string;
    order: 'asc' | 'desc';
  };

  // Metadata
  userId: string; // Creator
  userName: string;
  isPublic: boolean; // Shared with other tenant users
  isFavorite?: boolean;

  // Scheduling (optional for future)
  schedule?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
  };

  createdAt: Date;
  updatedAt: Date;
}

export type CustomReportDoc = ICustomReport & Document;

const CustomReportSchema = new Schema<ICustomReport>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    reportType: {
      type: String,
      required: true,
      enum: ['attendance', 'leaves', 'employees', 'payroll'],
    },

    fields: [{ type: String }],
    filters: { type: Schema.Types.Mixed, default: {} },
    sortBy: {
      field: { type: String },
      order: { type: String, enum: ['asc', 'desc'] },
    },

    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    isPublic: { type: Boolean, default: false },
    isFavorite: { type: Boolean, default: false },

    schedule: {
      enabled: { type: Boolean, default: false },
      frequency: { type: String, enum: ['daily', 'weekly', 'monthly'] },
      recipients: [{ type: String }],
    },
  },
  {
    timestamps: true,
    collection: 'custom_reports',
  }
);

// Indexes
CustomReportSchema.index({ tenantId: 1, userId: 1 });
CustomReportSchema.index({ tenantId: 1, isPublic: 1 });
CustomReportSchema.index({ tenantId: 1, reportType: 1 });

export const CustomReport = model('CustomReport', CustomReportSchema);
