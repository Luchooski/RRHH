import { Workflow, type WorkflowType, type IWorkflowStep } from './workflow.model.js';
import * as NotificationService from './notification.service.js';
import { v4 as uuidv4 } from 'uuid';

// Create a new workflow
export async function createWorkflow(params: {
  tenantId: string;
  type: WorkflowType;
  name: string;
  description?: string;
  resourceType: string;
  resourceId: string;
  resourceData?: Record<string, any>;
  requestedBy: string;
  requestedByName: string;
  steps: Array<{
    name: string;
    assignedTo: string;
    assignedToName: string;
    assignedToRole?: string;
    dueDate?: Date;
  }>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  metadata?: Record<string, any>;
}): Promise<any> {
  const {
    tenantId,
    type,
    name,
    description,
    resourceType,
    resourceId,
    resourceData,
    requestedBy,
    requestedByName,
    steps: stepsInput,
    priority = 'normal',
    metadata,
  } = params;

  const steps: IWorkflowStep[] = stepsInput.map((step, index) => ({
    stepId: uuidv4(),
    name: step.name,
    assignedTo: step.assignedTo,
    assignedToName: step.assignedToName,
    assignedToRole: step.assignedToRole,
    status: index === 0 ? 'pending' : 'pending',
    dueDate: step.dueDate,
    notificationSent: false,
    remindersSent: 0,
  }));

  const workflow = await Workflow.create({
    tenantId,
    type,
    name,
    description,
    resourceType,
    resourceId,
    resourceData,
    requestedBy,
    requestedByName,
    status: 'in-progress',
    currentStepIndex: 0,
    steps,
    priority,
    startedAt: new Date(),
    metadata,
  });

  // Send notification to first step assignee
  if (steps.length > 0) {
    const firstStep = steps[0];
    await NotificationService.createNotification({
      tenantId,
      userId: firstStep.assignedTo,
      userName: firstStep.assignedToName,
      templateKey: 'WORKFLOW_STEP_ASSIGNED',
      channels: ['in-app', 'email'],
      priority: priority === 'urgent' ? 'urgent' : 'high',
      actionUrl: `/workflows/${workflow._id}`,
      variables: {
        stepName: firstStep.name,
        workflowName: name,
      },
      data: {
        workflowId: workflow._id,
        stepId: firstStep.stepId,
        resourceType,
        resourceId,
      },
    });

    workflow.steps[0].notificationSent = true;
    await workflow.save();
  }

  return workflow.toObject();
}

// Complete a workflow step
export async function completeStep(params: {
  tenantId: string;
  workflowId: string;
  stepId: string;
  completedBy: string;
  completedByName: string;
  comments?: string;
  data?: Record<string, any>;
}): Promise<any> {
  const { tenantId, workflowId, stepId, completedBy, completedByName, comments, data } = params;

  const workflow = await Workflow.findOne({ _id: workflowId, tenantId });

  if (!workflow) {
    throw new Error('Workflow not found');
  }

  const stepIndex = workflow.steps.findIndex((s) => s.stepId === stepId);
  if (stepIndex === -1) {
    throw new Error('Step not found');
  }

  const step = workflow.steps[stepIndex];

  // Verify that the step is assigned to this user
  if (step.assignedTo !== completedBy) {
    throw new Error('You are not authorized to complete this step');
  }

  // Mark step as completed
  step.status = 'completed';
  step.completedAt = new Date();
  step.completedBy = completedBy;
  step.completedByName = completedByName;
  if (comments) step.comments = comments;
  if (data) step.data = data;

  // Check if this is the last step
  if (stepIndex === workflow.steps.length - 1) {
    // Workflow completed
    workflow.status = 'completed';
    workflow.completedAt = new Date();

    // Notify requester
    await NotificationService.createNotification({
      tenantId,
      userId: workflow.requestedBy,
      userName: workflow.requestedByName,
      templateKey: 'WORKFLOW_COMPLETED',
      channels: ['in-app', 'email'],
      priority: 'normal',
      actionUrl: `/workflows/${workflow._id}`,
      variables: {
        workflowName: workflow.name,
      },
      data: {
        workflowId: workflow._id,
        resourceType: workflow.resourceType,
        resourceId: workflow.resourceId,
      },
    });
  } else {
    // Move to next step
    workflow.currentStepIndex = stepIndex + 1;
    const nextStep = workflow.steps[workflow.currentStepIndex];
    nextStep.status = 'pending';

    // Send notification to next step assignee
    await NotificationService.createNotification({
      tenantId,
      userId: nextStep.assignedTo,
      userName: nextStep.assignedToName,
      templateKey: 'WORKFLOW_STEP_ASSIGNED',
      channels: ['in-app', 'email'],
      priority: workflow.priority === 'urgent' ? 'urgent' : 'high',
      actionUrl: `/workflows/${workflow._id}`,
      variables: {
        stepName: nextStep.name,
        workflowName: workflow.name,
      },
      data: {
        workflowId: workflow._id,
        stepId: nextStep.stepId,
        resourceType: workflow.resourceType,
        resourceId: workflow.resourceId,
      },
    });

    nextStep.notificationSent = true;
  }

  await workflow.save();

  return workflow.toObject();
}

// Reject a workflow step
export async function rejectStep(params: {
  tenantId: string;
  workflowId: string;
  stepId: string;
  rejectedBy: string;
  rejectedByName: string;
  reason: string;
}): Promise<any> {
  const { tenantId, workflowId, stepId, rejectedBy, rejectedByName, reason } = params;

  const workflow = await Workflow.findOne({ _id: workflowId, tenantId });

  if (!workflow) {
    throw new Error('Workflow not found');
  }

  const stepIndex = workflow.steps.findIndex((s) => s.stepId === stepId);
  if (stepIndex === -1) {
    throw new Error('Step not found');
  }

  const step = workflow.steps[stepIndex];

  // Verify authorization
  if (step.assignedTo !== rejectedBy) {
    throw new Error('You are not authorized to reject this step');
  }

  // Mark step as rejected
  step.status = 'rejected';
  step.completedAt = new Date();
  step.completedBy = rejectedBy;
  step.completedByName = rejectedByName;
  step.comments = reason;

  // Mark workflow as cancelled
  workflow.status = 'cancelled';
  workflow.cancelledAt = new Date();
  workflow.cancelledBy = rejectedBy;
  workflow.cancellationReason = `Rejected at step: ${step.name}. Reason: ${reason}`;

  await workflow.save();

  // Notify requester
  await NotificationService.createNotification({
    tenantId,
    userId: workflow.requestedBy,
    userName: workflow.requestedByName,
    templateKey: 'WORKFLOW_REJECTED',
    channels: ['in-app', 'email'],
    priority: 'high',
    actionUrl: `/workflows/${workflow._id}`,
    variables: {
      workflowName: workflow.name,
      stepName: step.name,
      reason,
    },
    data: {
      workflowId: workflow._id,
      resourceType: workflow.resourceType,
      resourceId: workflow.resourceId,
    },
  });

  return workflow.toObject();
}

// Cancel workflow
export async function cancelWorkflow(params: {
  tenantId: string;
  workflowId: string;
  cancelledBy: string;
  reason: string;
}): Promise<any> {
  const { tenantId, workflowId, cancelledBy, reason } = params;

  const workflow = await Workflow.findOne({ _id: workflowId, tenantId });

  if (!workflow) {
    throw new Error('Workflow not found');
  }

  workflow.status = 'cancelled';
  workflow.cancelledAt = new Date();
  workflow.cancelledBy = cancelledBy;
  workflow.cancellationReason = reason;

  await workflow.save();

  return workflow.toObject();
}

// Get user's pending workflows (assigned to them)
export async function getUserPendingWorkflows(params: {
  tenantId: string;
  userId: string;
  limit?: number;
  skip?: number;
}): Promise<any> {
  const { tenantId, userId, limit = 50, skip = 0 } = params;

  const workflows = await Workflow.find({
    tenantId,
    status: 'in-progress',
    'steps.assignedTo': userId,
  })
    .sort({ priority: -1, createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();

  // Filter to only workflows where user has a pending step
  const filtered = workflows.filter((workflow: any) => {
    const currentStep = workflow.steps[workflow.currentStepIndex];
    return currentStep && currentStep.assignedTo === userId && currentStep.status === 'pending';
  });

  return {
    workflows: filtered,
    total: filtered.length,
  };
}

// Get workflows created by user
export async function getUserCreatedWorkflows(params: {
  tenantId: string;
  userId: string;
  status?: string;
  limit?: number;
  skip?: number;
}): Promise<any> {
  const { tenantId, userId, status, limit = 50, skip = 0 } = params;

  const query: any = {
    tenantId,
    requestedBy: userId,
  };

  if (status) query.status = status;

  const workflows = await Workflow.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();

  const total = await Workflow.countDocuments(query);

  return {
    workflows,
    total,
  };
}

// Get workflow by ID
export async function getWorkflowById(params: {
  tenantId: string;
  workflowId: string;
}): Promise<any> {
  const { tenantId, workflowId } = params;

  const workflow = await Workflow.findOne({ _id: workflowId, tenantId }).lean();

  if (!workflow) {
    throw new Error('Workflow not found');
  }

  return workflow;
}

// Get workflow stats
export async function getWorkflowStats(params: {
  tenantId: string;
  userId?: string;
}): Promise<any> {
  const { tenantId, userId } = params;

  const baseQuery: any = { tenantId };
  if (userId) {
    baseQuery.$or = [
      { requestedBy: userId },
      { 'steps.assignedTo': userId },
    ];
  }

  const total = await Workflow.countDocuments(baseQuery);
  const pending = await Workflow.countDocuments({ ...baseQuery, status: 'pending' });
  const inProgress = await Workflow.countDocuments({ ...baseQuery, status: 'in-progress' });
  const completed = await Workflow.countDocuments({ ...baseQuery, status: 'completed' });
  const cancelled = await Workflow.countDocuments({ ...baseQuery, status: 'cancelled' });

  // Get user's pending tasks
  let pendingTasks = 0;
  if (userId) {
    const workflows = await Workflow.find({
      tenantId,
      status: 'in-progress',
      'steps.assignedTo': userId,
    }).lean();

    for (const workflow of workflows) {
      const currentStep = (workflow as any).steps[(workflow as any).currentStepIndex];
      if (currentStep && currentStep.assignedTo === userId && currentStep.status === 'pending') {
        pendingTasks++;
      }
    }
  }

  return {
    total,
    pending,
    inProgress,
    completed,
    cancelled,
    pendingTasks,
  };
}

// Send reminders for overdue steps
export async function sendOverdueReminders(tenantId: string): Promise<any> {
  const now = new Date();

  const workflows = await Workflow.find({
    tenantId,
    status: 'in-progress',
  });

  let remindersSent = 0;

  for (const workflow of workflows) {
    const currentStep = workflow.steps[workflow.currentStepIndex];

    if (
      currentStep &&
      currentStep.status === 'pending' &&
      currentStep.dueDate &&
      currentStep.dueDate < now
    ) {
      // Send reminder
      await NotificationService.createNotification({
        tenantId,
        userId: currentStep.assignedTo,
        userName: currentStep.assignedToName,
        title: 'Tarea Vencida',
        message: `La tarea "${currentStep.name}" en el proceso "${workflow.name}" está vencida desde ${currentStep.dueDate.toLocaleDateString()}.`,
        type: 'warning',
        channels: ['in-app', 'email'],
        priority: 'urgent',
        category: 'workflow',
        actionUrl: `/workflows/${workflow._id}`,
        actionLabel: 'Ver Tarea',
        data: {
          workflowId: workflow._id,
          stepId: currentStep.stepId,
        },
      });

      currentStep.remindersSent = (currentStep.remindersSent || 0) + 1;
      remindersSent++;
    }
  }

  // Save all workflows with updated reminder counts
  await Promise.all(workflows.map((w) => w.save()));

  return {
    success: true,
    remindersSent,
  };
}
