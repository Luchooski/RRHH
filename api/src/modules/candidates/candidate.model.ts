import { Schema, model, type InferSchemaType } from 'mongoose';

const CandidateSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    email: { type: String, required: false, index: true },
    role: { type: String, required: true, index: true },
    match: { type: Number, default: 0, min: 0, max: 100 },
    status: { type: String, default: 'new', index: true },
        source: { type: String, enum: ['cv','form','import','manual'], default: 'manual' },
    notes: { type: String, default: null },
  },
  { timestamps: true }
);

// Búsqueda simple por texto
CandidateSchema.index({ name: 'text', email: 'text', role: 'text' });

export type CandidateDoc = InferSchemaType<typeof CandidateSchema> & { _id: any };
export const CandidateModel = model('Candidate', CandidateSchema, 'candidates');
