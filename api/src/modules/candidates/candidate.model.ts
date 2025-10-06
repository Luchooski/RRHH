import { Schema, model, type Document } from 'mongoose';

export type Seniority = 'jr' | 'ssr' | 'sr';

export interface CandidateDoc extends Document {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  seniority?: Seniority;
  skills: string[];
  salaryExpectation?: number;
  resumeUrl?: string;
  notes?: string;
  tags: string[];
  links: { label?: string; url: string }[];
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
    name: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    phone: { type: String, trim: true },
    location: { type: String, trim: true },
    seniority: { type: String, enum: ['jr', 'ssr', 'sr'] },
    skills: { type: [String], default: [] },
    salaryExpectation: { type: Number },
    resumeUrl: { type: String, trim: true },
    notes: { type: String },
    tags: { type: [String], default: [] },
    links: { type: [LinkSchema], default: [] },
  },
  { timestamps: true }
);

CandidateSchema.index({ name: 'text', email: 'text', skills: 'text', tags: 'text' });

export const Candidate = model<CandidateDoc>('Candidate', CandidateSchema);
