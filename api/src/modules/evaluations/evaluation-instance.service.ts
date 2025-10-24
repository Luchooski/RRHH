import { EvaluationInstance, IEvaluationInstance } from './evaluation-instance.model.js';
import { EvaluationTemplate } from './evaluation-template.model.js';
import { updateCycleStats } from './evaluation-cycle.service.js';

/**
 * List evaluation instances
 */
export async function listEvaluations(params: {
  tenantId: string;
  cycleId?: string;
  evaluatedEmployeeId?: string;
  evaluatorId?: string;
  status?: string;
}) {
  const { tenantId, cycleId, evaluatedEmployeeId, evaluatorId, status } = params;

  const query: any = { tenantId };
  if (cycleId) query.cycleId = cycleId;
  if (evaluatedEmployeeId) query.evaluatedEmployeeId = evaluatedEmployeeId;
  if (evaluatorId) query.evaluatorId = evaluatorId;
  if (status) query.status = status;

  const evaluations = await EvaluationInstance.find(query)
    .sort({ createdAt: -1 })
    .lean();

  return evaluations;
}

/**
 * Get evaluation by ID
 */
export async function getEvaluationById(params: {
  tenantId: string;
  evaluationId: string;
}): Promise<any> {
  const { tenantId, evaluationId } = params;

  const evaluation = await EvaluationInstance.findOne({
    _id: evaluationId,
    tenantId,
  }).lean();

  if (!evaluation) {
    throw new Error('Evaluation not found');
  }

  return evaluation;
}

/**
 * Start evaluation (change status from pending to in-progress)
 */
export async function startEvaluation(params: {
  tenantId: string;
  evaluationId: string;
  userId: string;
}) {
  const { tenantId, evaluationId, userId } = params;

  const evaluation = await EvaluationInstance.findOne({
    _id: evaluationId,
    tenantId,
    evaluatorId: userId,
  });

  if (!evaluation) {
    throw new Error('Evaluation not found or you are not the evaluator');
  }

  if ((evaluation as any).status !== 'pending') {
    throw new Error('Evaluation has already been started');
  }

  (evaluation as any).status = 'in-progress';
  (evaluation as any).startedAt = new Date();
  await evaluation.save();

  return evaluation;
}

/**
 * Update evaluation (save progress)
 */
export async function updateEvaluation(params: {
  tenantId: string;
  evaluationId: string;
  userId: string;
  updates: {
    competencyRatings?: any[];
    objectiveRatings?: any[];
    generalAnswers?: any[];
    overallComment?: string;
  };
}) {
  const { tenantId, evaluationId, userId, updates } = params;

  const evaluation = await EvaluationInstance.findOne({
    _id: evaluationId,
    tenantId,
    evaluatorId: userId,
  });

  if (!evaluation) {
    throw new Error('Evaluation not found or you are not the evaluator');
  }

  if ((evaluation as any).status === 'completed') {
    throw new Error('Cannot update completed evaluation');
  }

  // Update fields
  if (updates.competencyRatings) {
    (evaluation as any).competencyRatings = updates.competencyRatings;
  }
  if (updates.objectiveRatings) {
    (evaluation as any).objectiveRatings = updates.objectiveRatings;
  }
  if (updates.generalAnswers) {
    (evaluation as any).generalAnswers = updates.generalAnswers;
  }
  if (updates.overallComment !== undefined) {
    (evaluation as any).overallComment = updates.overallComment;
  }

  // Auto-start if pending
  if ((evaluation as any).status === 'pending') {
    (evaluation as any).status = 'in-progress';
    (evaluation as any).startedAt = new Date();
  }

  await evaluation.save();

  return evaluation;
}

/**
 * Submit evaluation
 */
export async function submitEvaluation(params: {
  tenantId: string;
  evaluationId: string;
  userId: string;
  userName: string;
}) {
  const { tenantId, evaluationId, userId, userName } = params;

  const evaluation = await EvaluationInstance.findOne({
    _id: evaluationId,
    tenantId,
    evaluatorId: userId,
  });

  if (!evaluation) {
    throw new Error('Evaluation not found or you are not the evaluator');
  }

  if ((evaluation as any).status === 'completed') {
    throw new Error('Evaluation already completed');
  }

  // Get template to validate
  const template = await EvaluationTemplate.findOne({
    _id: (evaluation as any).templateId,
    tenantId,
  });

  if (!template) {
    throw new Error('Template not found');
  }

  // Validate all required competencies are rated
  const templateData = template as any;
  const evalData = evaluation as any;

  const requiredCompetencies = templateData.competencies.filter((c: any) => c.required);
  const ratedCompetencyIds = evalData.competencyRatings.map((r: any) => r.competencyId);

  for (const comp of requiredCompetencies) {
    if (!ratedCompetencyIds.includes(comp.id)) {
      throw new Error(`Missing rating for required competency: ${comp.name}`);
    }
  }

  // Calculate overall rating (weighted average)
  const overallRating = calculateWeightedRating(
    evalData.competencyRatings,
    templateData.competencies
  );

  evalData.overallRating = overallRating;
  evalData.submittedAt = new Date();
  evalData.submittedBy = userId;

  // Determine next status based on workflow
  if (templateData.config.requireManagerApproval && evalData.evaluatorRole === 'self') {
    evalData.status = 'manager-review';
  } else if (templateData.config.requireHRApproval) {
    evalData.status = 'hr-review';
  } else {
    evalData.status = 'completed';
    evalData.completedAt = new Date();
  }

  await evaluation.save();

  // Update cycle stats
  await updateCycleStats({ tenantId, cycleId: evalData.cycleId });

  return evaluation;
}

/**
 * Manager review
 */
export async function managerReview(params: {
  tenantId: string;
  evaluationId: string;
  managerId: string;
  managerName: string;
  approved: boolean;
  comments?: string;
  overallRating?: number;
}) {
  const { tenantId, evaluationId, managerId, managerName, approved, comments, overallRating } = params;

  const evaluation = await EvaluationInstance.findOne({
    _id: evaluationId,
    tenantId,
  });

  if (!evaluation) {
    throw new Error('Evaluation not found');
  }

  const evalData = evaluation as any;

  if (evalData.status !== 'manager-review') {
    throw new Error('Evaluation is not in manager review status');
  }

  // Verify user is the manager
  // TODO: Add proper manager verification

  evalData.managerReview = {
    reviewedAt: new Date(),
    reviewedBy: managerId,
    reviewerName: managerName,
    approved,
    comments,
    overallRating,
  };

  // If manager provides overall rating, use it
  if (overallRating) {
    evalData.overallRating = overallRating;
  }

  // Get template for workflow
  const template = await EvaluationTemplate.findOne({
    _id: evalData.templateId,
    tenantId,
  });

  const templateData = template as any;

  if (approved) {
    if (templateData?.config.requireHRApproval) {
      evalData.status = 'hr-review';
    } else {
      evalData.status = 'completed';
      evalData.completedAt = new Date();
    }
  } else {
    // If not approved, send back to employee
    evalData.status = 'in-progress';
  }

  await evaluation.save();

  // Update cycle stats
  await updateCycleStats({ tenantId, cycleId: evalData.cycleId });

  return evaluation;
}

/**
 * HR review
 */
export async function hrReview(params: {
  tenantId: string;
  evaluationId: string;
  hrId: string;
  hrName: string;
  approved: boolean;
  comments?: string;
}) {
  const { tenantId, evaluationId, hrId, hrName, approved, comments } = params;

  const evaluation = await EvaluationInstance.findOne({
    _id: evaluationId,
    tenantId,
  });

  if (!evaluation) {
    throw new Error('Evaluation not found');
  }

  const evalData = evaluation as any;

  if (evalData.status !== 'hr-review') {
    throw new Error('Evaluation is not in HR review status');
  }

  evalData.hrReview = {
    reviewedAt: new Date(),
    reviewedBy: hrId,
    reviewerName: hrName,
    approved,
    comments,
  };

  if (approved) {
    evalData.status = 'completed';
    evalData.completedAt = new Date();
  } else {
    // Send back to manager review or employee
    evalData.status = 'manager-review';
  }

  await evaluation.save();

  // Update cycle stats
  await updateCycleStats({ tenantId, cycleId: evalData.cycleId });

  return evaluation;
}

/**
 * Calculate weighted rating
 */
function calculateWeightedRating(
  ratings: any[],
  competencies: any[]
): number {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const rating of ratings) {
    const competency = competencies.find((c: any) => c.id === rating.competencyId);
    if (competency) {
      weightedSum += rating.rating * competency.weight;
      totalWeight += competency.weight;
    }
  }

  if (totalWeight === 0) return 0;

  return Math.round((weightedSum / totalWeight) * 100) / 100;
}

/**
 * Get employee evaluation summary (all evaluations for an employee in a cycle)
 */
export async function getEmployeeEvaluationSummary(params: {
  tenantId: string;
  cycleId: string;
  employeeId: string;
}) {
  const { tenantId, cycleId, employeeId } = params;

  const evaluations = await EvaluationInstance.find({
    tenantId,
    cycleId,
    evaluatedEmployeeId: employeeId,
  }).lean();

  if (evaluations.length === 0) {
    return null;
  }

  // Calculate aggregate scores
  const completedEvaluations = evaluations.filter((e: any) => e.status === 'completed' && e.overallRating);

  const selfEvaluation = evaluations.find((e: any) => e.evaluatorRole === 'self');
  const managerEvaluation = evaluations.find((e: any) => e.evaluatorRole === 'manager');
  const peerEvaluations = evaluations.filter((e: any) => e.evaluatorRole === 'peer');

  let averageScore = 0;
  if (completedEvaluations.length > 0) {
    averageScore = completedEvaluations.reduce((sum: number, e: any) => sum + (e.overallRating || 0), 0) / completedEvaluations.length;
    averageScore = Math.round(averageScore * 100) / 100;
  }

  return {
    employeeId,
    cycleId,
    totalEvaluations: evaluations.length,
    completedEvaluations: completedEvaluations.length,
    pendingEvaluations: evaluations.filter((e: any) => e.status === 'pending').length,
    averageScore,
    selfEvaluation: selfEvaluation ? {
      status: (selfEvaluation as any).status,
      overallRating: (selfEvaluation as any).overallRating,
    } : null,
    managerEvaluation: managerEvaluation ? {
      status: (managerEvaluation as any).status,
      overallRating: (managerEvaluation as any).overallRating,
    } : null,
    peerEvaluationsCount: peerEvaluations.length,
    evaluations,
  };
}
