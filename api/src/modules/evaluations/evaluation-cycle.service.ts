import { EvaluationCycle, IEvaluationCycle } from './evaluation-cycle.model.js';
import { EvaluationInstance } from './evaluation-instance.model.js';
import { EvaluationTemplate } from './evaluation-template.model.js';
import { Employee } from '../employee/employee.model.js';

/**
 * Create evaluation cycle
 */
export async function createCycle(params: {
  tenantId: string;
  userId: string;
  userName: string;
  data: {
    name: string;
    description?: string;
    templateId: string;
    startDate: Date;
    endDate: Date;
    evaluationDeadline: Date;
  };
}) {
  const { tenantId, userId, userName, data } = params;

  // Verify template exists
  const template = await EvaluationTemplate.findOne({
    _id: data.templateId,
    tenantId,
  });

  if (!template) {
    throw new Error('Template not found');
  }

  const cycle = new EvaluationCycle({
    ...data,
    tenantId,
    createdBy: userId,
    createdByName: userName,
    status: 'draft',
  });

  await cycle.save();
  return cycle;
}

/**
 * List cycles
 */
export async function listCycles(params: {
  tenantId: string;
  status?: string;
}) {
  const { tenantId, status } = params;

  const query: any = { tenantId };
  if (status) query.status = status;

  const cycles = await EvaluationCycle.find(query)
    .sort({ createdAt: -1 })
    .lean();

  return cycles;
}

/**
 * Get cycle by ID
 */
export async function getCycleById(params: {
  tenantId: string;
  cycleId: string;
}): Promise<any> {
  const { tenantId, cycleId } = params;

  const cycle = await EvaluationCycle.findOne({
    _id: cycleId,
    tenantId,
  }).lean();

  if (!cycle) {
    throw new Error('Cycle not found');
  }

  return cycle;
}

/**
 * Update cycle
 */
export async function updateCycle(params: {
  tenantId: string;
  cycleId: string;
  updates: Partial<IEvaluationCycle>;
}) {
  const { tenantId, cycleId, updates } = params;

  const cycle = await EvaluationCycle.findOneAndUpdate(
    { _id: cycleId, tenantId },
    { $set: updates },
    { new: true }
  );

  if (!cycle) {
    throw new Error('Cycle not found');
  }

  return cycle;
}

/**
 * Delete cycle
 */
export async function deleteCycle(params: {
  tenantId: string;
  cycleId: string;
}) {
  const { tenantId, cycleId } = params;

  // Check if there are any evaluations assigned
  const evaluationsCount = await EvaluationInstance.countDocuments({
    tenantId,
    cycleId,
  });

  if (evaluationsCount > 0) {
    throw new Error('Cannot delete cycle with assigned evaluations');
  }

  const result = await EvaluationCycle.deleteOne({
    _id: cycleId,
    tenantId,
  });

  if (result.deletedCount === 0) {
    throw new Error('Cycle not found');
  }

  return { success: true };
}

/**
 * Launch cycle - Assign evaluations to employees
 */
export async function launchCycle(params: {
  tenantId: string;
  cycleId: string;
  employeeIds?: string[];    // If provided, only assign to these employees
  includeSelfEvaluation?: boolean;
}) {
  const { tenantId, cycleId, employeeIds, includeSelfEvaluation = true } = params;

  // Get cycle and template
  const cycle = await EvaluationCycle.findOne({
    _id: cycleId,
    tenantId,
  });

  if (!cycle) {
    throw new Error('Cycle not found');
  }

  if ((cycle as any).status !== 'draft') {
    throw new Error('Cycle has already been launched');
  }

  const template = await EvaluationTemplate.findOne({
    _id: (cycle as any).templateId,
    tenantId,
  });

  if (!template) {
    throw new Error('Template not found');
  }

  // Get employees to assign
  let employees;
  if (employeeIds && employeeIds.length > 0) {
    employees = await Employee.find({
      _id: { $in: employeeIds },
      tenantId,
      status: 'active',
    }).lean();
  } else {
    // Apply template filters
    const templateConfig = template as any;
    const query: any = { tenantId, status: 'active' };

    if (!templateConfig.applicableTo.all) {
      if (templateConfig.applicableTo.departments?.length > 0) {
        query.department = { $in: templateConfig.applicableTo.departments };
      }
      if (templateConfig.applicableTo.positions?.length > 0) {
        query.position = { $in: templateConfig.applicableTo.positions };
      }
      if (templateConfig.applicableTo.employmentTypes?.length > 0) {
        query.employmentType = { $in: templateConfig.applicableTo.employmentTypes };
      }
    }

    employees = await Employee.find(query).lean();
  }

  if (employees.length === 0) {
    throw new Error('No employees found to assign evaluations');
  }

  // Create evaluation instances
  const evaluations = [];
  const cycleData = cycle as any;
  const templateData = template as any;

  for (const employee of employees) {
    const empData = employee as any;

    // Self-evaluation
    if (includeSelfEvaluation && templateData.config.allowSelfEvaluation) {
      evaluations.push({
        tenantId,
        cycleId: cycleData._id.toString(),
        templateId: templateData._id.toString(),
        evaluatedEmployeeId: empData._id.toString(),
        evaluatedEmployeeName: empData.name,
        evaluatedEmployeeDepartment: empData.department,
        evaluatedEmployeePosition: empData.position,
        evaluatorId: empData._id.toString(),
        evaluatorName: empData.name,
        evaluatorRole: 'self',
        competencyRatings: [],
        objectiveRatings: [],
        generalAnswers: [],
        status: 'pending',
        dueDate: cycleData.evaluationDeadline,
      });
    }

    // Manager evaluation
    if (empData.managerId) {
      const manager = await Employee.findOne({
        _id: empData.managerId,
        tenantId,
      }).lean();

      if (manager) {
        evaluations.push({
          tenantId,
          cycleId: cycleData._id.toString(),
          templateId: templateData._id.toString(),
          evaluatedEmployeeId: empData._id.toString(),
          evaluatedEmployeeName: empData.name,
          evaluatedEmployeeDepartment: empData.department,
          evaluatedEmployeePosition: empData.position,
          evaluatorId: manager._id.toString(),
          evaluatorName: manager.name,
          evaluatorRole: 'manager',
          competencyRatings: [],
          objectiveRatings: [],
          generalAnswers: [],
          status: 'pending',
          dueDate: cycleData.evaluationDeadline,
        });
      }
    }
  }

  // Bulk insert evaluations
  if (evaluations.length > 0) {
    await EvaluationInstance.insertMany(evaluations);
  }

  // Update cycle status and stats
  (cycle as any).status = 'active';
  (cycle as any).launchedAt = new Date();
  (cycle as any).stats.totalAssigned = evaluations.length;
  (cycle as any).stats.totalPending = evaluations.length;
  await cycle.save();

  return {
    cycle,
    assignedCount: evaluations.length,
    employeeCount: employees.length,
  };
}

/**
 * Update cycle statistics
 */
export async function updateCycleStats(params: {
  tenantId: string;
  cycleId: string;
}) {
  const { tenantId, cycleId } = params;

  const [cycle, totalAssigned, totalCompleted, totalInProgress, totalPending, avgScoreResult] = await Promise.all([
    EvaluationCycle.findOne({ _id: cycleId, tenantId }),
    EvaluationInstance.countDocuments({ tenantId, cycleId }),
    EvaluationInstance.countDocuments({ tenantId, cycleId, status: 'completed' }),
    EvaluationInstance.countDocuments({ tenantId, cycleId, status: { $in: ['in-progress', 'submitted', 'manager-review', 'hr-review'] } }),
    EvaluationInstance.countDocuments({ tenantId, cycleId, status: 'pending' }),
    EvaluationInstance.aggregate([
      { $match: { tenantId, cycleId, status: 'completed', overallRating: { $exists: true } } },
      { $group: { _id: null, avg: { $avg: '$overallRating' } } }
    ])
  ]);

  if (!cycle) {
    throw new Error('Cycle not found');
  }

  const averageScore = avgScoreResult[0]?.avg || undefined;
  const completionRate = totalAssigned > 0 ? (totalCompleted / totalAssigned) * 100 : 0;

  (cycle as any).stats = {
    totalAssigned,
    totalCompleted,
    totalInProgress,
    totalPending,
    averageScore: averageScore ? Math.round(averageScore * 100) / 100 : undefined,
    completionRate: Math.round(completionRate * 100) / 100,
  };

  // Auto-complete cycle if all evaluations are done
  if (totalCompleted === totalAssigned && totalAssigned > 0 && (cycle as any).status === 'active') {
    (cycle as any).status = 'completed';
    (cycle as any).completedAt = new Date();
  }

  await cycle.save();

  return cycle;
}
