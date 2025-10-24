import { Schema, model, Document } from 'mongoose';

/**
 * Rating Scale - Escala de calificación
 */
export interface IRatingScale {
  value: number;        // 1-5, 1-10, etc.
  label: string;        // "Excelente", "Bueno", "Regular", etc.
  description?: string; // Descripción detallada
  color?: string;       // Color para UI (#4ade80, #ef4444, etc.)
}

/**
 * Competency - Competencia a evaluar
 */
export interface ICompetency {
  id: string;           // UUID único
  name: string;         // "Trabajo en equipo", "Liderazgo", etc.
  description: string;  // Descripción de la competencia
  category: string;     // "Técnica", "Blanda", "Liderazgo", etc.
  weight: number;       // Peso porcentual (0-100)
  required: boolean;    // Si es obligatoria
}

/**
 * Objective - Objetivo específico
 */
export interface IObjective {
  id: string;
  description: string;  // Descripción del objetivo
  metric?: string;      // Métrica de medición
  target?: string;      // Meta esperada
  weight: number;       // Peso porcentual
}

/**
 * Evaluation Template - Plantilla de evaluación
 */
export interface IEvaluationTemplate {
  tenantId: string;
  name: string;
  description?: string;

  // Type of evaluation
  type: 'self' | 'manager' | '360' | 'quarterly' | 'annual' | 'probation';

  // Rating scale configuration
  ratingScale: {
    min: number;        // Mínimo (ej: 1)
    max: number;        // Máximo (ej: 5)
    scales: IRatingScale[];
  };

  // Competencies to evaluate
  competencies: ICompetency[];

  // Objectives (optional)
  objectives: IObjective[];

  // General questions (open text)
  generalQuestions: {
    id: string;
    question: string;
    required: boolean;
  }[];

  // Configuration
  config: {
    allowSelfEvaluation: boolean;     // Permite autoevaluación
    requireManagerApproval: boolean;   // Requiere aprobación del jefe
    requireHRApproval: boolean;        // Requiere aprobación de RRHH
    allowComments: boolean;            // Permite comentarios
    anonymousFor360: boolean;          // Anónimo para 360°
  };

  // Applicable to
  applicableTo: {
    departments?: string[];   // Departamentos específicos
    positions?: string[];     // Cargos específicos
    employmentTypes?: string[]; // Tipos de contrato
    all: boolean;             // Aplica a todos
  };

  // Metadata
  isActive: boolean;
  createdBy: string;
  createdByName: string;

  createdAt: Date;
  updatedAt: Date;
}

export type EvaluationTemplateDoc = IEvaluationTemplate & Document;

const RatingScaleSchema = new Schema({
  value: { type: Number, required: true },
  label: { type: String, required: true },
  description: { type: String },
  color: { type: String },
}, { _id: false });

const CompetencySchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  weight: { type: Number, required: true, min: 0, max: 100 },
  required: { type: Boolean, default: true },
}, { _id: false });

const ObjectiveSchema = new Schema({
  id: { type: String, required: true },
  description: { type: String, required: true },
  metric: { type: String },
  target: { type: String },
  weight: { type: Number, required: true, min: 0, max: 100 },
}, { _id: false });

const GeneralQuestionSchema = new Schema({
  id: { type: String, required: true },
  question: { type: String, required: true },
  required: { type: Boolean, default: false },
}, { _id: false });

const EvaluationTemplateSchema = new Schema<IEvaluationTemplate>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },

    type: {
      type: String,
      required: true,
      enum: ['self', 'manager', '360', 'quarterly', 'annual', 'probation'],
    },

    ratingScale: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
      scales: [RatingScaleSchema],
    },

    competencies: [CompetencySchema],
    objectives: [ObjectiveSchema],
    generalQuestions: [GeneralQuestionSchema],

    config: {
      allowSelfEvaluation: { type: Boolean, default: true },
      requireManagerApproval: { type: Boolean, default: true },
      requireHRApproval: { type: Boolean, default: false },
      allowComments: { type: Boolean, default: true },
      anonymousFor360: { type: Boolean, default: false },
    },

    applicableTo: {
      departments: [{ type: String }],
      positions: [{ type: String }],
      employmentTypes: [{ type: String }],
      all: { type: Boolean, default: false },
    },

    isActive: { type: Boolean, default: true },
    createdBy: { type: String, required: true },
    createdByName: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: 'evaluation_templates',
  }
);

// Indexes
EvaluationTemplateSchema.index({ tenantId: 1, isActive: 1 });
EvaluationTemplateSchema.index({ tenantId: 1, type: 1 });

export const EvaluationTemplate = model('EvaluationTemplate', EvaluationTemplateSchema);
