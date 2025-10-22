import mongoose, { Schema, InferSchemaType } from 'mongoose';

// Sub-esquema para dirección
const AddressSchema = new Schema({
  street: { type: String, trim: true },
  number: { type: String, trim: true },
  floor: { type: String, trim: true },
  apartment: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  postalCode: { type: String, trim: true },
  country: { type: String, trim: true, default: 'Argentina' }
}, { _id: false });

// Sub-esquema para contacto de emergencia
const EmergencyContactSchema = new Schema({
  name: { type: String, trim: true },
  relationship: { type: String, trim: true },
  phone: { type: String, trim: true },
  alternativePhone: { type: String, trim: true }
}, { _id: false });

// Sub-esquema para información bancaria
const BankInfoSchema = new Schema({
  bankName: { type: String, trim: true },
  accountType: { type: String, enum: ['savings', 'checking'], default: 'savings' },
  cbu: { type: String, trim: true },
  alias: { type: String, trim: true }
}, { _id: false });

// Sub-esquema para historial laboral interno
const JobHistorySchema = new Schema({
  position: { type: String, required: true, trim: true },
  department: { type: String, trim: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  salary: { type: Number },
  notes: { type: String }
}, { timestamps: true });

const EmployeeSchema = new Schema({
  // ===== DATOS BÁSICOS =====
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true, index: true, trim: true },
  email: { type: String, required: true, index: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },

  // ===== DATOS PERSONALES =====
  dni: { type: String, trim: true, sparse: true }, // DNI/Passport
  cuil: { type: String, trim: true, sparse: true }, // CUIL/CUIT
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['M', 'F', 'X', 'other', ''], default: '' },
  maritalStatus: { type: String, enum: ['single', 'married', 'divorced', 'widowed', 'other', ''], default: '' },
  nationality: { type: String, trim: true, default: 'Argentina' },

  // ===== DIRECCIÓN =====
  address: { type: AddressSchema },

  // ===== CONTACTO DE EMERGENCIA =====
  emergencyContact: { type: EmergencyContactSchema },

  // ===== DATOS LABORALES =====
  role: { type: String, required: true, index: true, trim: true }, // Puesto/cargo
  department: { type: String, trim: true, index: true },
  managerId: { type: String, index: true }, // ID del jefe directo
  hireDate: { type: Date, index: true }, // Fecha de ingreso
  endDate: { type: Date }, // Fecha de baja (si aplica)
  baseSalary: { type: Number, required: true },
  monthlyHours: { type: Number, required: true, default: 160 },
  contractType: { type: String, enum: ['fulltime', 'parttime', 'contract', 'temporary', 'intern', ''], default: 'fulltime' },

  // ===== ESTADO =====
  status: {
    type: String,
    enum: ['active', 'on_leave', 'suspended', 'terminated'],
    default: 'active',
    index: true
  },

  // ===== INFORMACIÓN FINANCIERA =====
  bankInfo: { type: BankInfoSchema },
  healthInsurance: { type: String, trim: true }, // Obra social
  taxId: { type: String, trim: true }, // Otro ID fiscal si aplica

  // ===== INFORMACIÓN ADICIONAL =====
  photo: { type: String }, // URL de la foto
  skills: [{ type: String, trim: true }], // Competencias/habilidades
  certifications: [{ type: String, trim: true }], // Certificaciones

  // ===== HISTORIAL LABORAL INTERNO =====
  jobHistory: [JobHistorySchema],

  // ===== NOTAS Y OBSERVACIONES =====
  notes: { type: String },

}, {
  timestamps: true,
  versionKey: false,
});

// ===== ÍNDICES =====
// Índice compuesto para queries por tenant
EmployeeSchema.index({ tenantId: 1, email: 1 });
EmployeeSchema.index({ tenantId: 1, createdAt: -1 });
EmployeeSchema.index({ tenantId: 1, status: 1 });
EmployeeSchema.index({ tenantId: 1, department: 1 });
EmployeeSchema.index({ tenantId: 1, hireDate: -1 });

// Índice único para DNI y CUIL dentro de cada tenant (sparse para permitir nulls)
EmployeeSchema.index({ tenantId: 1, dni: 1 }, { sparse: true, unique: true });
EmployeeSchema.index({ tenantId: 1, cuil: 1 }, { sparse: true, unique: true });

// ===== VIRTUAL ID =====
EmployeeSchema.virtual('id').get(function (this: { _id: mongoose.Types.ObjectId }) {
  return this._id?.toString();
});

// ===== VIRTUAL PARA NOMBRE COMPLETO DEL MANAGER =====
EmployeeSchema.virtual('manager', {
  ref: 'Employee',
  localField: 'managerId',
  foreignField: '_id',
  justOne: true
});

// ===== TRANSFORM =====
const transform = (_doc: any, ret: any) => {
  ret.id = ret.id ?? ret._id?.toString();
  delete ret._id;
  return ret;
};

EmployeeSchema.set('toJSON', { virtuals: true, transform });
EmployeeSchema.set('toObject', { virtuals: true, transform });

// ===== MÉTODOS =====
// Método para calcular antigüedad en años
EmployeeSchema.methods.getYearsOfService = function() {
  if (!this.hireDate) return 0;
  const now = new Date();
  const diff = now.getTime() - this.hireDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};

// Método para calcular edad
EmployeeSchema.methods.getAge = function() {
  if (!this.dateOfBirth) return null;
  const now = new Date();
  const diff = now.getTime() - this.dateOfBirth.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};

// ===== TYPES =====
export type EmployeeDoc = InferSchemaType<typeof EmployeeSchema> & {
  _id: any;
  getYearsOfService(): number;
  getAge(): number | null;
};

export const Employee = mongoose.model<EmployeeDoc>('Employee', EmployeeSchema);
