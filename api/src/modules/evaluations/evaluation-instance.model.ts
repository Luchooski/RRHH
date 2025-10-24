import { Schema, model, Document } from 'mongoose';

/**
 * Competency Rating - Calificación de una competencia
 */
export interface ICompetencyRating {
  competencyId: string;    // ID from template
  rating: number;          // Calificación (dentro de ratingScale)
  comment?: string;        // Comentario opcional
}

/**
 * Objective Rating - Calificación de un objetivo
 */
export interface IObjectiveRating {
  objectiveId: string;
  rating: number;
  achievement?: string;    // Nivel de logro
  comment?: string;
}

/**
 * General Answer - Respuesta a pregunta general
 */
export interface IGeneralAnswer {
  questionId: string;
  answer: string;
}

/**
 * Evaluation Instance - Instancia de evaluación individual
 * Representa una evaluación asignada a un empleado específico
 */
export interface IEvaluationInstance {
  tenantId: string;
  cycleId: string;         // Reference to EvaluationCycle
  templateId: string;      // Reference to EvaluationTemplate

  // Employee being evaluated
  evaluatedEmployeeId: string;
  evaluatedEmployeeName: string;
  evaluatedEmployeeDepartment?: string;
  evaluatedEmployeePosition?: string;

  // Evaluator
  evaluatorId: string;
  evaluatorName: string;
  evaluatorRole: string;   // "self", "manager", "peer", "subordinate"

  // Evaluation data
  competencyRatings: ICompetencyRating[];
  objectiveRatings: IObjectiveRating[];
  generalAnswers: IGeneralAnswer[];

  // Overall rating
  overallRating?: number;  // Calculated from weighted competencies
  overallComment?: string; // Comentario general del evaluador

  // Status and workflow
  status: 'pending' | 'in-progress' | 'submitted' | 'manager-review' | 'hr-review' | 'completed';

  // Approval workflow
  submittedAt?: Date;
  submittedBy?: string;

  managerReview?: {
    reviewedAt: Date;
    reviewedBy: string;
    reviewerName: string;
    approved: boolean;
    comments?: string;
    overallRating?: number;  // Manager's overall rating
  };

  hrReview?: {
    reviewedAt: Date;
    reviewedBy: string;
    reviewerName: string;
    approved: boolean;
    comments?: string;
  };

  completedAt?: Date;

  // Metadata
  dueDate: Date;           // Fecha límite
  startedAt?: Date;        // Cuando comenzó a completarse

  createdAt: Date;
  updatedAt: Date;
}

export type EvaluationInstanceDoc = IEvaluationInstance & Document;

const CompetencyRatingSchema = new Schema({
  competencyId: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: { type: String },
}, { _id: false });

const ObjectiveRatingSchema = new Schema({
  objectiveId: { type: String, required: true },
  rating: { type: Number, required: true },
  achievement: { type: String },
  comment: { type: String },
}, { _id: false });

const GeneralAnswerSchema = new Schema({
  questionId: { type: String, required: true },
  answer: { type: String, required: true },
}, { _id: false });

const ReviewSchema = new Schema({
  reviewedAt: { type: Date, required: true },
  reviewedBy: { type: String, required: true },
  reviewerName: { type: String, required: true },
  approved: { type: Boolean, required: true },
  comments: { type: String },
  overallRating: { type: Number },
}, { _id: false });

const EvaluationInstanceSchema = new Schema<IEvaluationInstance>(
  {
    tenantId: { type: String, required: true, index: true },
    cycleId: { type: String, required: true, index: true },
    templateId: { type: String, required: true },

    evaluatedEmployeeId: { type: String, required: true, index: true },
    evaluatedEmployeeName: { type: String, required: true },
    evaluatedEmployeeDepartment: { type: String },
    evaluatedEmployeePosition: { type: String },

    evaluatorId: { type: String, required: true, index: true },
    evaluatorName: { type: String, required: true },
    evaluatorRole: {
      type: String,
      required: true,
      enum: ['self', 'manager', 'peer', 'subordinate'],
    },

    competencyRatings: [CompetencyRatingSchema],
    objectiveRatings: [ObjectiveRatingSchema],
    generalAnswers: [GeneralAnswerSchema],

    overallRating: { type: Number },
    overallComment: { type: String },

    status: {
      type: String,
      required: true,
      enum: ['pending', 'in-progress', 'submitted', 'manager-review', 'hr-review', 'completed'],
      default: 'pending',
    },

    submittedAt: { type: Date },
    submittedBy: { type: String },

    managerReview: ReviewSchema,
    hrReview: ReviewSchema,

    completedAt: { type: Date },

    dueDate: { type: Date, required: true },
    startedAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'evaluation_instances',
  }
);

// Indexes
EvaluationInstanceSchema.index({ tenantId: 1, cycleId: 1, status: 1 });
EvaluationInstanceSchema.index({ tenantId: 1, evaluatedEmployeeId: 1 });
EvaluationInstanceSchema.index({ tenantId: 1, evaluatorId: 1 });
EvaluationInstanceSchema.index({ tenantId: 1, cycleId: 1, evaluatedEmployeeId: 1 });

// Compound index for finding all evaluations for an employee in a cycle
EvaluationInstanceSchema.index({
  tenantId: 1,
  cycleId: 1,
  evaluatedEmployeeId: 1
});

export const EvaluationInstance = model('EvaluationInstance', EvaluationInstanceSchema);
