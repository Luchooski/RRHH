import mongoose, { Schema, InferSchemaType } from 'mongoose';

const CandidateSchema = new Schema({
  name:  { type: String, required: true, index: true },
  email: { type: String, required: true, index: true },
  role:  { type: String, required: true, index: true },
  match: { type: Number, default: 0 },
  status:{ type: String, default: 'Nuevo' },
  source: { type: String, enum: ['cv','form','import','manual'], default: 'manual' },
    notes: { type: String, default: null },
}, {
  timestamps: true,
  versionKey: false,
  // si querés fijar la coleccion exacta: collection: 'candidates'
});

CandidateSchema.virtual('id').get(function (this: { _id: mongoose.Types.ObjectId }) {
  return this._id?.toString();
});

const transform = (_doc: any, ret: any) => {
  ret.id = ret.id ?? ret._id?.toString();
  delete ret._id;
  return ret;
};
CandidateSchema.set('toJSON',  { virtuals: true, transform });
CandidateSchema.set('toObject',{ virtuals: true, transform });

export type CandidateDoc = InferSchemaType<typeof CandidateSchema> & { _id: any };
export const Candidate = mongoose.model('Candidate', CandidateSchema);
