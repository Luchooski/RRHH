import { Schema, model } from 'mongoose';

const CandidateSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, required: true },
    match: { type: Number, min: 0, max: 100, default: 0 },
    status: { type: String, default: 'Activo' }
  },
  { timestamps: true }
);

CandidateSchema.index({ status: 1, createdAt: -1 });

export type CandidateDoc = {
  _id: string;
  name: string;
  email: string;
  role: string;
  match: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export const Candidate = model<CandidateDoc>('Candidate', CandidateSchema);
