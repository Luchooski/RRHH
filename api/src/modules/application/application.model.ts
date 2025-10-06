import { Schema, model, Types, type InferSchemaType } from 'mongoose';

const applicationSchema = new Schema({
  candidateId: { type: Types.ObjectId, ref: 'Candidate', required: true, index: true },
  vacancyId: { type: Types.ObjectId, ref: 'Vacancy', required: true, index: true },
  status: { type: String, enum: ['sent','interview','feedback','offer','hired','rejected'], default: 'sent', index: true },
  notes: { type: String },
}, { timestamps: true });

applicationSchema.index({ candidateId: 1, vacancyId: 1 }, { unique: true });

export type ApplicationDoc = InferSchemaType<typeof applicationSchema>;
export const Application = model('Application', applicationSchema);
