import mongoose, { Schema, InferSchemaType } from 'mongoose';

const EmployeeSchema = new Schema({
  tenantId:     { type: String, required: true, index: true },
  name:         { type: String, required: true, index: true },
  email:        { type: String, required: true, index: true },
  role:         { type: String, required: true, index: true },
  baseSalary:   { type: Number, required: true },
  monthlyHours: { type: Number, required: true },
  phone:        { type: String },
}, {
  timestamps: true,
  versionKey: false,
  // collection: 'employees'
});

// Índice compuesto para queries por tenant
EmployeeSchema.index({ tenantId: 1, email: 1 });
EmployeeSchema.index({ tenantId: 1, createdAt: -1 });

EmployeeSchema.virtual('id').get(function (this: { _id: mongoose.Types.ObjectId }) {
  return this._id?.toString();
});

const transform = (_doc: any, ret: any) => {
  ret.id = ret.id ?? ret._id?.toString();
  delete ret._id;
  return ret;
};
EmployeeSchema.set('toJSON',  { virtuals: true, transform });
EmployeeSchema.set('toObject',{ virtuals: true, transform });

export type EmployeeDoc = InferSchemaType<typeof EmployeeSchema> & { _id: any };
export const Employee = mongoose.model('Employee', EmployeeSchema);
