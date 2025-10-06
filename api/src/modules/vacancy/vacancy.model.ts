import { Schema, model, type Document, Types } from 'mongoose';

export type VacancyStatus = 'open' | 'paused' | 'closed';

export interface ChecklistItem {
  _id: Types.ObjectId;
  label: string;
  done: boolean;
  updatedAt: Date;
}

export interface VacancyDoc extends Document {
  title: string;
  status: VacancyStatus;
  companyId?: Types.ObjectId;
  companyName?: string;
  location?: string;
  seniority?: 'jr' | 'ssr' | 'sr';
  employmentType?: 'fulltime' | 'parttime' | 'contract';
  salaryMin?: number;
  salaryMax?: number;
  description?: string;

  // NUEVO
  checklist: ChecklistItem[];

  createdAt: Date;
  updatedAt: Date;
}

const ChecklistItemSchema = new Schema<ChecklistItem>(
  {
    label: { type: String, required: true, trim: true },
    done: { type: Boolean, default: false },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const VacancySchema = new Schema<VacancyDoc>(
  {
    title: { type: String, required: true, trim: true },
    status: { type: String, enum: ['open', 'paused', 'closed'], default: 'open', index: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company' },
    companyName: { type: String, trim: true },
    location: { type: String, trim: true },
    seniority: { type: String, enum: ['jr', 'ssr', 'sr'], required: false },
    employmentType: { type: String, enum: ['fulltime', 'parttime', 'contract'], required: false },
    salaryMin: { type: Number },
    salaryMax: { type: Number },
    description: { type: String },

    // NUEVO
    checklist: { type: [ChecklistItemSchema], default: [] },
  },
  { timestamps: true }
);

VacancySchema.index({ status: 1, updatedAt: -1 });
VacancySchema.index({ title: 'text', companyName: 'text' });

export const Vacancy = model<VacancyDoc>('Vacancy', VacancySchema);
