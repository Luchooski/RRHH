import { Schema, model } from 'mongoose';

const CandidateSchema = new Schema(
  {
    fullName: { type: String, required: true, index: 'text' },
    email: { type: String, required: true, unique: true, index: true },
    phone: { type: String, default: null },
    skills: { type: [String], default: [], index: true },
    status: { type: String, enum: ['applied','screening','interview','offer','hired','rejected'], default: 'applied', index: true },
    source: { type: String, enum: ['cv','form','import','manual'], default: 'manual' },
    notes: { type: String, default: null },
  },
  { timestamps: true }
);

CandidateSchema.index({ fullName: 'text', email: 'text' });

export const CandidateModel = model('Candidate', CandidateSchema);
