import { Schema, model, type Document, Types } from 'mongoose';

export type AppStatus = 'sent' | 'interview' | 'feedback' | 'offer' | 'hired' | 'rejected';

export interface ApplicationDoc extends Document {
  vacancyId: Types.ObjectId;
  candidateId: Types.ObjectId;
  status: AppStatus;
  notes?: string;
  order: number; // <— NUEVO
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema = new Schema<ApplicationDoc>(
  {
    vacancyId: { type: Schema.Types.ObjectId, ref: 'Vacancy', required: true, index: true },
    candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
    status: { type: String, enum: ['sent','interview','feedback','offer','hired','rejected'], default: 'sent', index: true },
    notes: { type: String },
    order: { type: Number, default: 0 }, // <— NUEVO
  },
  { timestamps: true }
);

ApplicationSchema.index({ vacancyId: 1, status: 1, order: 1, createdAt: 1 });

export const Application = model<ApplicationDoc>('Application', ApplicationSchema);
