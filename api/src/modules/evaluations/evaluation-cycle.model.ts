import { Schema, model, Document } from 'mongoose';

/**
 * Evaluation Cycle - Ciclo de evaluación
 * Representa un período de evaluaciones (ej: Q1 2024, Anual 2024, etc.)
 */
export interface IEvaluationCycle {
  tenantId: string;
  name: string;              // "Q1 2024", "Evaluación Anual 2024"
  description?: string;

  // Template to use
  templateId: string;        // Reference to EvaluationTemplate

  // Period
  startDate: Date;
  endDate: Date;
  evaluationDeadline: Date;  // Fecha límite para completar evaluaciones

  // Status
  status: 'draft' | 'active' | 'in-progress' | 'completed' | 'cancelled';

  // Statistics
  stats: {
    totalAssigned: number;       // Total asignadas
    totalCompleted: number;      // Completadas
    totalPending: number;        // Pendientes
    totalInProgress: number;     // En progreso
    averageScore?: number;       // Promedio general
    completionRate: number;      // Tasa de completitud (%)
  };

  // Metadata
  createdBy: string;
  createdByName: string;
  launchedAt?: Date;           // Cuando se lanzó el ciclo
  completedAt?: Date;          // Cuando se completó

  createdAt: Date;
  updatedAt: Date;
}

export type EvaluationCycleDoc = IEvaluationCycle & Document;

const EvaluationCycleSchema = new Schema<IEvaluationCycle>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },

    templateId: { type: String, required: true, index: true },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    evaluationDeadline: { type: Date, required: true },

    status: {
      type: String,
      required: true,
      enum: ['draft', 'active', 'in-progress', 'completed', 'cancelled'],
      default: 'draft',
    },

    stats: {
      totalAssigned: { type: Number, default: 0 },
      totalCompleted: { type: Number, default: 0 },
      totalPending: { type: Number, default: 0 },
      totalInProgress: { type: Number, default: 0 },
      averageScore: { type: Number },
      completionRate: { type: Number, default: 0 },
    },

    createdBy: { type: String, required: true },
    createdByName: { type: String, required: true },
    launchedAt: { type: Date },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'evaluation_cycles',
  }
);

// Indexes
EvaluationCycleSchema.index({ tenantId: 1, status: 1 });
EvaluationCycleSchema.index({ tenantId: 1, startDate: 1, endDate: 1 });

export const EvaluationCycle = model('EvaluationCycle', EvaluationCycleSchema);
