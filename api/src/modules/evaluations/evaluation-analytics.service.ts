import { EvaluationInstance } from './evaluation-instance.model.js';
import { EvaluationCycle } from './evaluation-cycle.model.js';
import { EvaluationTemplate } from './evaluation-template.model.js';

/**
 * Get comprehensive analytics for a cycle
 */
export async function getCycleAnalytics(params: {
  tenantId: string;
  cycleId: string;
}) {
  const { tenantId, cycleId } = params;

  const evaluations = await EvaluationInstance.find({
    tenantId,
    cycleId,
  }).lean();

  const completedEvaluations = evaluations.filter((e: any) => e.status === 'completed');

  // Overall stats
  const totalEvaluations = evaluations.length;
  const totalCompleted = completedEvaluations.length;
  const totalPending = evaluations.filter((e: any) => e.status === 'pending').length;
  const totalInProgress = evaluations.filter((e: any) => e.status === 'in-progress').length;

  // Score stats
  const scores = completedEvaluations
    .filter((e: any) => e.overallRating)
    .map((e: any) => e.overallRating);

  const averageScore = scores.length > 0
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length
    : 0;

  const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
  const minScore = scores.length > 0 ? Math.min(...scores) : 0;

  // Score distribution (1-2, 2-3, 3-4, 4-5)
  const distribution = {
    '1-2': scores.filter(s => s >= 1 && s < 2).length,
    '2-3': scores.filter(s => s >= 2 && s < 3).length,
    '3-4': scores.filter(s => s >= 3 && s < 4).length,
    '4-5': scores.filter(s => s >= 4 && s <= 5).length,
  };

  // By evaluator role
  const byRole = {
    self: completedEvaluations.filter((e: any) => e.evaluatorRole === 'self').length,
    manager: completedEvaluations.filter((e: any) => e.evaluatorRole === 'manager').length,
    peer: completedEvaluations.filter((e: any) => e.evaluatorRole === 'peer').length,
    subordinate: completedEvaluations.filter((e: any) => e.evaluatorRole === 'subordinate').length,
  };

  // Average by role
  const avgByRole: any = {};
  for (const role of ['self', 'manager', 'peer', 'subordinate']) {
    const roleEvals = completedEvaluations.filter((e: any) => e.evaluatorRole === role && e.overallRating);
    if (roleEvals.length > 0) {
      const roleScores = roleEvals.map((e: any) => e.overallRating);
      avgByRole[role] = roleScores.reduce((sum: number, s: number) => sum + s, 0) / roleScores.length;
      avgByRole[role] = Math.round(avgByRole[role] * 100) / 100;
    } else {
      avgByRole[role] = 0;
    }
  }

  return {
    cycleId,
    totalEvaluations,
    totalCompleted,
    totalPending,
    totalInProgress,
    completionRate: totalEvaluations > 0 ? Math.round((totalCompleted / totalEvaluations) * 100) : 0,
    averageScore: Math.round(averageScore * 100) / 100,
    maxScore,
    minScore,
    scoreDistribution: distribution,
    byRole,
    avgByRole,
  };
}

/**
 * Compare departments performance
 */
export async function getDepartmentComparison(params: {
  tenantId: string;
  cycleId: string;
}) {
  const { tenantId, cycleId } = params;

  const evaluations = await EvaluationInstance.find({
    tenantId,
    cycleId,
    status: 'completed',
  }).lean();

  // Group by department
  const byDepartment: any = {};

  for (const evaluation of evaluations) {
    const evalData = evaluation as any;
    const dept = evalData.evaluatedEmployeeDepartment || 'Sin Departamento';

    if (!byDepartment[dept]) {
      byDepartment[dept] = {
        department: dept,
        totalEvaluations: 0,
        totalEmployees: new Set(),
        scores: [],
      };
    }

    byDepartment[dept].totalEvaluations++;
    byDepartment[dept].totalEmployees.add(evalData.evaluatedEmployeeId);

    if (evalData.overallRating) {
      byDepartment[dept].scores.push(evalData.overallRating);
    }
  }

  // Calculate averages
  const results = Object.values(byDepartment).map((dept: any) => ({
    department: dept.department,
    totalEmployees: dept.totalEmployees.size,
    totalEvaluations: dept.totalEvaluations,
    averageScore: dept.scores.length > 0
      ? Math.round((dept.scores.reduce((sum: number, s: number) => sum + s, 0) / dept.scores.length) * 100) / 100
      : 0,
    maxScore: dept.scores.length > 0 ? Math.max(...dept.scores) : 0,
    minScore: dept.scores.length > 0 ? Math.min(...dept.scores) : 0,
  }));

  // Sort by average score descending
  results.sort((a, b) => b.averageScore - a.averageScore);

  return results;
}

/**
 * Get top performers in a cycle
 */
export async function getTopPerformers(params: {
  tenantId: string;
  cycleId: string;
  limit?: number;
}) {
  const { tenantId, cycleId, limit = 10 } = params;

  const evaluations = await EvaluationInstance.find({
    tenantId,
    cycleId,
    status: 'completed',
  }).lean();

  // Group by employee
  const byEmployee: any = {};

  for (const evaluation of evaluations) {
    const evalData = evaluation as any;
    const empId = evalData.evaluatedEmployeeId;

    if (!byEmployee[empId]) {
      byEmployee[empId] = {
        employeeId: empId,
        employeeName: evalData.evaluatedEmployeeName,
        department: evalData.evaluatedEmployeeDepartment,
        position: evalData.evaluatedEmployeePosition,
        evaluations: [],
      };
    }

    if (evalData.overallRating) {
      byEmployee[empId].evaluations.push({
        evaluatorRole: evalData.evaluatorRole,
        overallRating: evalData.overallRating,
      });
    }
  }

  // Calculate average for each employee
  const results = Object.values(byEmployee).map((emp: any) => {
    const scores = emp.evaluations.map((e: any) => e.overallRating);
    const avgScore = scores.length > 0
      ? scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length
      : 0;

    return {
      employeeId: emp.employeeId,
      employeeName: emp.employeeName,
      department: emp.department,
      position: emp.position,
      averageScore: Math.round(avgScore * 100) / 100,
      totalEvaluations: emp.evaluations.length,
      evaluationBreakdown: emp.evaluations,
    };
  });

  // Filter employees with at least one evaluation
  const filtered = results.filter(r => r.totalEvaluations > 0);

  // Sort by average score descending
  filtered.sort((a, b) => b.averageScore - a.averageScore);

  return filtered.slice(0, limit);
}

/**
 * Analyze competencies across the cycle
 */
export async function getCompetencyAnalysis(params: {
  tenantId: string;
  cycleId: string;
}) {
  const { tenantId, cycleId } = params;

  // Get cycle and template
  const cycle = await EvaluationCycle.findOne({ _id: cycleId, tenantId }).lean();
  if (!cycle) {
    throw new Error('Cycle not found');
  }

  const template = await EvaluationTemplate.findOne({
    _id: (cycle as any).templateId,
    tenantId,
  }).lean();

  if (!template) {
    throw new Error('Template not found');
  }

  const templateData = template as any;

  const evaluations = await EvaluationInstance.find({
    tenantId,
    cycleId,
    status: 'completed',
  }).lean();

  // Aggregate ratings by competency
  const competencyRatings: any = {};

  for (const competency of templateData.competencies) {
    competencyRatings[competency.id] = {
      competencyId: competency.id,
      competencyName: competency.name,
      category: competency.category,
      weight: competency.weight,
      ratings: [],
    };
  }

  for (const evaluation of evaluations) {
    const evalData = evaluation as any;
    for (const rating of evalData.competencyRatings || []) {
      if (competencyRatings[rating.competencyId]) {
        competencyRatings[rating.competencyId].ratings.push(rating.rating);
      }
    }
  }

  // Calculate stats for each competency
  const results = Object.values(competencyRatings).map((comp: any) => {
    const scores = comp.ratings;
    const avgScore = scores.length > 0
      ? scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length
      : 0;

    return {
      competencyId: comp.competencyId,
      competencyName: comp.competencyName,
      category: comp.category,
      weight: comp.weight,
      totalRatings: scores.length,
      averageScore: Math.round(avgScore * 100) / 100,
      maxScore: scores.length > 0 ? Math.max(...scores) : 0,
      minScore: scores.length > 0 ? Math.min(...scores) : 0,
    };
  });

  // Identify strengths (top 3) and weaknesses (bottom 3)
  const sorted = [...results].filter(r => r.totalRatings > 0).sort((a, b) => b.averageScore - a.averageScore);
  const strengths = sorted.slice(0, 3);
  const weaknesses = sorted.slice(-3).reverse();

  return {
    competencies: results,
    strengths,
    weaknesses,
  };
}

/**
 * Get employee performance history across multiple cycles
 */
export async function getEmployeeHistory(params: {
  tenantId: string;
  employeeId: string;
  limit?: number;
}) {
  const { tenantId, employeeId, limit = 10 } = params;

  const evaluations = await EvaluationInstance.find({
    tenantId,
    evaluatedEmployeeId: employeeId,
    status: 'completed',
  })
    .sort({ completedAt: -1 })
    .limit(limit)
    .lean();

  // Group by cycle
  const byCycle: any = {};

  for (const evaluation of evaluations) {
    const evalData = evaluation as any;
    const cycleId = evalData.cycleId;

    if (!byCycle[cycleId]) {
      byCycle[cycleId] = {
        cycleId,
        evaluations: [],
      };
    }

    byCycle[cycleId].evaluations.push({
      evaluationId: evalData._id,
      evaluatorRole: evalData.evaluatorRole,
      evaluatorName: evalData.evaluatorName,
      overallRating: evalData.overallRating,
      completedAt: evalData.completedAt,
    });
  }

  // Get cycle details
  const cycleIds = Object.keys(byCycle);
  const cycles = await EvaluationCycle.find({
    _id: { $in: cycleIds },
    tenantId,
  }).lean();

  const cycleMap: any = {};
  for (const cycle of cycles) {
    cycleMap[(cycle as any)._id.toString()] = cycle;
  }

  // Build results
  const results = Object.entries(byCycle).map(([cycleId, data]: [string, any]) => {
    const cycle = cycleMap[cycleId];
    const scores = data.evaluations.map((e: any) => e.overallRating).filter((s: number) => s);
    const avgScore = scores.length > 0
      ? scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length
      : 0;

    return {
      cycleId,
      cycleName: cycle ? (cycle as any).name : 'Unknown',
      startDate: cycle ? (cycle as any).startDate : null,
      endDate: cycle ? (cycle as any).endDate : null,
      totalEvaluations: data.evaluations.length,
      averageScore: Math.round(avgScore * 100) / 100,
      evaluations: data.evaluations,
    };
  });

  // Sort by most recent first
  results.sort((a, b) => {
    if (!a.endDate) return 1;
    if (!b.endDate) return -1;
    return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
  });

  return results;
}

/**
 * Get score trends over time (for dashboards)
 */
export async function getScoreTrends(params: {
  tenantId: string;
  employeeId?: string;
  department?: string;
  limit?: number;
}) {
  const { tenantId, employeeId, department, limit = 5 } = params;

  // Get recent cycles
  const cycles = await EvaluationCycle.find({
    tenantId,
    status: 'completed',
  })
    .sort({ endDate: -1 })
    .limit(limit)
    .lean();

  const results = [];

  for (const cycle of cycles) {
    const cycleData = cycle as any;
    const query: any = {
      tenantId,
      cycleId: cycleData._id,
      status: 'completed',
    };

    if (employeeId) {
      query.evaluatedEmployeeId = employeeId;
    }

    if (department) {
      query.evaluatedEmployeeDepartment = department;
    }

    const evaluations = await EvaluationInstance.find(query).lean();

    const scores = evaluations
      .filter((e: any) => e.overallRating)
      .map((e: any) => e.overallRating);

    const avgScore = scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;

    results.push({
      cycleId: cycleData._id,
      cycleName: cycleData.name,
      endDate: cycleData.endDate,
      averageScore: Math.round(avgScore * 100) / 100,
      totalEvaluations: evaluations.length,
    });
  }

  // Reverse to show chronological order
  results.reverse();

  return results;
}
