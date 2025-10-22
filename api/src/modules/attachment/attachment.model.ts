import mongoose, { Schema, InferSchemaType } from 'mongoose';

const AttachmentSchema = new Schema({
  tenantId: { type: String, required: true, index: true },
  employeeId: { type: String, required: true, index: true },
  filename: { type: String, required: true }, // Original filename
  storedFilename: { type: String, required: true, unique: true }, // Unique filename on disk
  fileType: {
    type: String,
    enum: ['dni', 'cv', 'contract', 'certificate', 'photo', 'other'],
    default: 'other',
    index: true
  },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true }, // Size in bytes
  path: { type: String, required: true }, // Storage path
  uploadedBy: { type: String, required: true }, // User ID who uploaded
  description: { type: String }, // Optional description
}, {
  timestamps: true,
  versionKey: false,
});

// Compound indexes for efficient queries
AttachmentSchema.index({ tenantId: 1, employeeId: 1, createdAt: -1 });
AttachmentSchema.index({ tenantId: 1, fileType: 1 });

AttachmentSchema.virtual('id').get(function (this: { _id: mongoose.Types.ObjectId }) {
  return this._id?.toString();
});

const transform = (_doc: any, ret: any) => {
  ret.id = ret.id ?? ret._id?.toString();
  delete ret._id;
  delete ret.path; // Don't expose internal path
  return ret;
};

AttachmentSchema.set('toJSON', { virtuals: true, transform });
AttachmentSchema.set('toObject', { virtuals: true, transform });

export type AttachmentDoc = InferSchemaType<typeof AttachmentSchema> & { _id: any };
export const Attachment = mongoose.model('Attachment', AttachmentSchema);
