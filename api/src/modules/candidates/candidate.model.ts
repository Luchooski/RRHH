import { Schema, model, type Document } from 'mongoose';

 export type Seniority = 'jr' | 'ssr' | 'sr';
export type PipelineStage = 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';

 export interface CandidateDoc extends Document {
  tenantId: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  location?: string; // compat
  seniority?: Seniority;
  skills: string[];
  languages?: string[];
  salary?: number;
  salaryExpectation?: number; // compat
  avatarUrl?: string;
  resume?: {
    filename: string; mimetype: string; size: number; url: string;
    analysis?: { textExcerpt?: string; technologies?: string[]; pages?: number };
  };
  notes?: string;
  tags: string[];
  links: { label?: string; url: string }[];
  status: PipelineStage;
  pipelineHistory: { stage: PipelineStage; at: Date; by?: string; note?: string }[];
  comments: { by?: string; text: string; at: Date }[];
  reminders: { at: Date; note: string; done: boolean }[];
  customFields?: Record<string, unknown>;
  archivedAt?: Date | null;
  source?: 'cv' | 'form' | 'import' | 'manual';
   createdAt: Date;
   updatedAt: Date;
 }

 const LinkSchema = new Schema(
   {
     label: { type: String, trim: true },
     url: { type: String, trim: true },
   },
   { _id: false }
 );

 const CandidateSchema = new Schema<CandidateDoc>(
   {
     tenantId: { type: String, required: true, index: true },
     name: { type: String, required: true, trim: true, index: true },
     email: { type: String, required: true, trim: true, lowercase: true, index: true },
     phone: { type: String, trim: true },
    city: String,
    country: String,
    location: { type: String, trim: true },
     seniority: { type: String, enum: ['jr', 'ssr', 'sr'] },
     skills: { type: [String], default: [] },
    languages: { type: [String], default: [] },
    salary: { type: Number },
    salaryExpectation: { type: Number },
    avatarUrl: { type: String, trim: true },
    resume: {
      filename: String, mimetype: String, size: Number, url: String,
      analysis: { textExcerpt: String, technologies: [String], pages: Number }
    },
     notes: { type: String },
     tags: { type: [String], default: [] },
     links: { type: [LinkSchema], default: [] },
    status: { type: String, enum: ['new','screening','interview','offer','hired','rejected'], default: 'new', index: true },
    pipelineHistory: { type: [{ stage: String, at: Date, by: String, note: String }], default: [] },
    comments: { type: [{ by: String, text: String, at: Date }], default: [] },
    reminders: { type: [{ at: Date, note: String, done: { type: Boolean, default: false } }], default: [] },
    customFields: { type: Schema.Types.Mixed, default: {} },
    archivedAt: { type: Date, default: null, index: true },
    source: { type: String, enum: ['cv','form','import','manual'], default: 'manual' }
   },
   { timestamps: true }
 );

 CandidateSchema.index({ name: 'text', email: 'text', skills: 'text', tags: 'text' });

 export const Candidate = model<CandidateDoc>('Candidate', CandidateSchema);
