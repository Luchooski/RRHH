import mongoose, { Schema, InferSchemaType } from 'mongoose';

const ConceptSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['remunerativo','no_remunerativo','deduccion'], required: true },
  mode: { type: String, enum: ['monto','porcentaje'], required: true },
  value: { type: Number, required: true },
  base: { type: String, enum: ['imponible','bruto','neto_previo','personalizado'], default: 'imponible' },
  phase: { type: String, enum: ['pre_tax','post_tax'], default: 'pre_tax' },
  minAmount: Number,
  maxAmount: Number,
  roundMode: { type: String, enum: ['none','nearest','down','up'], default: 'nearest' },
  roundDecimals: { type: Number, default: 2 },
  priority: { type: Number, default: 100 },
  enabled: { type: Boolean, default: true },
  customBase: Number
}, { _id: false });

const PayrollSchema = new Schema({
  employeeId: { type: String, required: true, index: true },
  employeeName: { type: String, required: true },
  period: { type: String, required: true, index: true }, // YYYY-MM
  baseSalary: { type: Number, required: true },
  bonuses: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },
  overtimeRate: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  contributionsRate: { type: Number, default: 0 },
  status: { type: String, enum: ['Borrador','Aprobado'], default: 'Borrador', index: true },
  concepts: { type: [ConceptSchema], default: [] }
}, { timestamps: true, versionKey: false });

// Virtual para id (sirve también en .lean({ virtuals: true }))
PayrollSchema.virtual('id').get(function (this: { _id: mongoose.Types.ObjectId }) {
  return this._id?.toString();
});

// Normalizar salida JSON/Objeto: _id -> id y ocultar _id
PayrollSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret.id ?? ret._id?.toString();
    delete ret._id;
    return ret;
  },
});
PayrollSchema.set('toObject', {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret.id ?? ret._id?.toString();
    delete ret._id;
    return ret;
  },
});

export type PayrollDoc = InferSchemaType<typeof PayrollSchema> & { _id: any };
export const Payroll = mongoose.model('Payroll', PayrollSchema);
