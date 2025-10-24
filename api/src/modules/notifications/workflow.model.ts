import mongoose, { Schema, Document } from 'mongoose';

export type WorkflowStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled' | 'failed';
export type WorkflowType = 'leave-approval' | 'evaluation-review' | 'benefit-enrollment' | 'document-approval' | 'custom';

export interface IWorkflowStep {
  stepId: string;
  name: string;
  assignedTo: string; // userId
  assignedToName: string;
  assignedToRole?: string; // 'manager', 'hr', 'admin', etc.
  status: 'pending' | 'in-progress' | 'completed' | 'rejected' | 'skipped';
  dueDate?: Date;
  completedAt?: Date;
  completedBy?: string;
  completedByName?: string;
  comments?: string;
  data?: Record<string, any>;
  notificationSent?: boolean;
  remindersSent?: number;
}

export interface IWorkflow {
  tenantId: string;
  type: WorkflowType;
  name: string;
  description?: string;
  resourceType: string; // 'leave', 'evaluation', 'benefit', etc.
  resourceId: string;
  resourceData?: Record<string, any>;
  requestedBy: string;
  requestedByName: string;
  status: WorkflowStatus;
  currentStepIndex: number;
  steps: IWorkflowStep[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  startedAt: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelledBy?: string;
  cancellationReason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type WorkflowDoc = IWorkflow & Document;

const WorkflowStepSchema = new Schema<IWorkflowStep>({
  stepId: { type: String, required: true },
  name: { type: String, required: true },
  assignedTo: { type: String, required: true },
  assignedToName: { type: String, required: true },
  assignedToRole: { type: String },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'rejected', 'skipped'],
    default: 'pending',
  },
  dueDate: { type: Date },
  completedAt: { type: Date },
  completedBy: { type: String },
  completedByName: { type: String },
  comments: { type: String },
  data: { type: Schema.Types.Mixed },
  notificationSent: { type: Boolean, default: false },
  remindersSent: { type: Number, default: 0 },
});

const WorkflowSchema = new Schema<IWorkflow>(
  {
    tenantId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['leave-approval', 'evaluation-review', 'benefit-enrollment', 'document-approval', 'custom'],
      required: true,
    },
    name: { type: String, required: true },
    description: { type: String },
    resourceType: { type: String, required: true, index: true },
    resourceId: { type: String, required: true, index: true },
    resourceData: { type: Schema.Types.Mixed },
    requestedBy: { type: String, required: true },
    requestedByName: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'cancelled', 'failed'],
      default: 'pending',
      index: true,
    },
    currentStepIndex: { type: Number, default: 0 },
    steps: [WorkflowStepSchema],
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    cancelledBy: { type: String },
    cancellationReason: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for queries
WorkflowSchema.index({ tenantId: 1, status: 1 });
WorkflowSchema.index({ tenantId: 1, resourceType: 1, resourceId: 1 });
WorkflowSchema.index({ tenantId: 1, requestedBy: 1, status: 1 });
WorkflowSchema.index({ 'steps.assignedTo': 1, status: 1 });

export const Workflow = mongoose.model('Workflow', WorkflowSchema);
