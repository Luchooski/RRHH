import { Schema, model } from 'mongoose';

const CandidateSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, required: true, index: true },
    match: { type: Number, min: 0, max: 100, default: 0, index: true },
    status: { type: String, default: 'Activo', index: true }
  },
  { timestamps: true }
);

CandidateSchema.index({ name: 'text', role: 'text' });
CandidateSchema.index({ status: 1, createdAt: -1 });  // ya existía en tu base; si no, agregar

export const Candidate = model('Candidate', CandidateSchema);
export type CandidateDoc = typeof Candidate extends infer T ? T : never;
