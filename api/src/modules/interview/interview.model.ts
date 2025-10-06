import { Schema, model, type Document } from 'mongoose';

export type InterviewStatus = 'Programada' | 'Completada' | 'Cancelada' | 'Pendiente';

export interface InterviewDoc extends Document {
  title: string;
  start: Date;          // fecha/hora inicio
  end: Date;            // fecha/hora fin
  candidateId?: string; // opcional para MVP
  vacancyId?: string;   // opcional
  location?: string | null;
  notes?: string | null;
  status: InterviewStatus;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewSchema = new Schema<InterviewDoc>({
  title: { type: String, required: true, trim: true },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  candidateId: { type: String, index: true },
  vacancyId: { type: String, index: true },
  location: { type: String, default: null, trim: true },
  notes: { type: String, default: null, trim: true },
  status: { type: String, enum: ['Programada','Completada','Cancelada','Pendiente'], required: true, default: 'Programada' },
}, { timestamps: true });

InterviewSchema.index({ start: 1 });
InterviewSchema.index({ status: 1 });

export const Interview = model<InterviewDoc>('Interview', InterviewSchema);
