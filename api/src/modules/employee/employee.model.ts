import { Schema, model, type InferSchemaType } from 'mongoose';

const EmployeeSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    email: { type: String, required: true, index: true },
    role: { type: String, required: true, index: true },
    phone: { type: String },
    baseSalary: { type: Number, required: true, min: 0 },
    monthlyHours: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);

export type EmployeeDoc = InferSchemaType<typeof EmployeeSchema> & { _id: any };
export const EmployeeModel = model('Employee', EmployeeSchema, 'employees');
