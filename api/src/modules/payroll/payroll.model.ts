import { Schema, model, Document } from 'mongoose';

export type PayrollStatus = 'pendiente'|'aprobada'|'pagada'|'anulada'|'Borrador'|'Aprobado';
export type ConceptType = 'remunerativo'|'no_remunerativo'|'indemnizacion';

export interface Concept { code: string; label: string; type: ConceptType; amount: number; taxable: boolean; }
export interface Deduction { code: string; label: string; amount: number; }

export interface PayrollDoc extends Document {
  tenantId: string;
  employeeId: string;
  employeeName: string;
  period: string; // YYYY-MM
  type: 'mensual'|'final'|'extraordinaria'|'vacaciones';
  status: PayrollStatus;

  baseSalary: number;
  concepts: Concept[];
  deductions: Deduction[];
  grossTotal: number;
  deductionsTotal: number;
  netTotal: number;
  currency: string;

  paymentMethod?: 'transferencia'|'efectivo'|'cheque'|'otro';
  bankAccount?: string;
  paymentDate?: Date;
  receiptUrl?: string;

  notes?: string;
  approvedBy?: string;

  createdAt: Date;
  updatedAt: Date;
}

const ConceptSchema = new Schema<Concept>({
  code: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, enum: ['remunerativo','no_remunerativo','indemnizacion'], required: true },
  amount: { type: Number, required: true },
  taxable: { type: Boolean, default: true },
}, { _id: false });

const DeductionSchema = new Schema<Deduction>({
  code: { type: String, required: true },
  label: { type: String, required: true },
  amount: { type: Number, required: true },
}, { _id: false });

const PayrollSchema = new Schema<PayrollDoc>({
  tenantId: { type: String, required: true, index: true },
  employeeId: { type: String, required: true, index: true },
  employeeName: { type: String, required: true },
  period: { type: String, required: true, index: true },
  type: { type: String, enum: ['mensual','final','extraordinaria','vacaciones'], default: 'mensual' },
  status: { type: String, enum: ['pendiente','aprobada','pagada','anulada','Borrador','Aprobado'], default: 'pendiente', index: true },
  baseSalary: { type: Number, required: true },

  concepts: { type: [ConceptSchema], default: [] },
  deductions: { type: [DeductionSchema], default: [] },
  grossTotal: { type: Number, required: true },
  deductionsTotal: { type: Number, required: true },
  netTotal: { type: Number, required: true },
  currency: { type: String, default: 'ARS' },

  paymentMethod: { type: String, enum: ['transferencia','efectivo','cheque','otro'] },
  bankAccount: String,
  paymentDate: Date,
  receiptUrl: String,

  notes: String,
  approvedBy: String,
}, { timestamps: true });

// Índices compuestos para queries por tenant
PayrollSchema.index({ tenantId: 1, employeeId: 1, period: 1 });
PayrollSchema.index({ tenantId: 1, status: 1, period: -1 });
PayrollSchema.index({ tenantId: 1, createdAt: -1 });

export const PayrollModel = model<PayrollDoc>('Payroll', PayrollSchema);
