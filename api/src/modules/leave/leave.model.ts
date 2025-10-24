import mongoose, { Schema, InferSchemaType, Model } from 'mongoose';

export type LeaveType =
  | 'vacation'      // Vacaciones
  | 'sick'          // Enfermedad
  | 'personal'      // Día personal
  | 'maternity'     // Maternidad
  | 'paternity'     // Paternidad
  | 'bereavement'   // Duelo
  | 'study'         // Estudio
  | 'unpaid'        // Sin goce de sueldo
  | 'other';        // Otro

export type LeaveStatus =
  | 'pending'       // Pendiente de aprobación
  | 'approved'      // Aprobada
  | 'rejected'      // Rechazada
  | 'cancelled';    // Cancelada

interface ILeave {
  tenantId: string;
  employeeId: string;
  employeeName: string; // Desnormalizado para queries rápidas

  // Tipo y fechas
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  days: number;       // Días laborables (calculado)
  halfDay: boolean;   // Media jornada

  // Razón y detalles
  reason?: string;
  description?: string;

  // Estado y aprobación
  status: LeaveStatus;
  requestedAt: Date;
  approvedBy?: string;      // User ID del aprobador
  approvedByName?: string;  // Nombre del aprobador
  approvedAt?: Date;
  rejectedReason?: string;

  // Metadata
  attachments?: string[];   // URLs de certificados médicos, etc.
  notes?: string;          // Notas internas

  createdAt: Date;
  updatedAt: Date;
}

const LeaveSchema = new Schema<ILeave>(
  {
    tenantId: { type: String, required: true, index: true },
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true },

    // Tipo y fechas
    type: {
      type: String,
      required: true,
      enum: ['vacation', 'sick', 'personal', 'maternity', 'paternity', 'bereavement', 'study', 'unpaid', 'other'],
      index: true
    },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    days: { type: Number, required: true, min: 0.5 },
    halfDay: { type: Boolean, default: false },

    // Razón y detalles
    reason: { type: String, trim: true },
    description: { type: String },

    // Estado y aprobación
    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
      index: true
    },
    requestedAt: { type: Date, default: Date.now },
    approvedBy: { type: String },
    approvedByName: { type: String },
    approvedAt: { type: Date },
    rejectedReason: { type: String },

    // Metadata
    attachments: [{ type: String }],
    notes: { type: String }
  },
  { timestamps: true }
);

// ===== ÍNDICES =====
LeaveSchema.index({ tenantId: 1, employeeId: 1, startDate: -1 });
LeaveSchema.index({ tenantId: 1, status: 1, startDate: -1 });
LeaveSchema.index({ tenantId: 1, type: 1, status: 1 });
LeaveSchema.index({ startDate: 1, endDate: 1 }); // Para overlapping queries

// ===== VIRTUAL ID =====
LeaveSchema.virtual('id').get(function (this: { _id: mongoose.Types.ObjectId }) {
  return this._id?.toString();
});

// ===== TRANSFORM =====
const transform = (_doc: any, ret: any) => {
  ret.id = ret.id ?? ret._id?.toString();
  delete ret._id;
  return ret;
};

LeaveSchema.set('toJSON', { virtuals: true, transform });
LeaveSchema.set('toObject', { virtuals: true, transform });

// ===== MÉTODOS =====

// Método para verificar si la licencia está activa en una fecha dada
LeaveSchema.methods.isActiveOn = function(date: Date): boolean {
  return date >= this.startDate && date <= this.endDate && this.status === 'approved';
};

// Método para calcular días laborables entre dos fechas (excluyendo fines de semana)
LeaveSchema.statics.calculateBusinessDays = function(startDate: Date, endDate: Date, halfDay: boolean = false): number {
  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    // Excluir sábados (6) y domingos (0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  // Si es media jornada, dividir por 2
  return halfDay ? count / 2 : count;
};

// ===== TIPOS =====
export type LeaveDoc = ILeave & mongoose.Document & {
  id: string;
  isActiveOn(date: Date): boolean;
};

export interface LeaveModel extends Model<LeaveDoc> {
  calculateBusinessDays(startDate: Date, endDate: Date, halfDay?: boolean): number;
}

export const Leave = mongoose.model<LeaveDoc, LeaveModel>('Leave', LeaveSchema);
