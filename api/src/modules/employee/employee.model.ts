import { Schema, model } from 'mongoose';

const EmployeeSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, required: true },           // posición/puesto
    phone: { type: String },
    baseSalary: { type: Number, default: 0 },
    monthlyHours: { type: Number, default: 160 }
  },
  { timestamps: true }
);

EmployeeSchema.index({ name: 'text', role: 'text' });

export type EmployeeDoc = {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  baseSalary: number;
  monthlyHours: number;
  createdAt: Date;
  updatedAt: Date;
};

export const Employee = model<EmployeeDoc>('Employee', EmployeeSchema);
