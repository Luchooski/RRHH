import { http } from '@/lib/api';
import type {
  EvaluationTemplate,
  EvaluationCycle,
  EvaluationInstance,
  CreateTemplateDto,
  CreateCycleDto,
  LaunchCycleDto,
  UpdateEvaluationDto,
  ManagerReviewDto,
  HRReviewDto,
  CycleAnalytics,
  DepartmentComparison,
  TopPerformer,
  CompetencyAnalysis,
  EmployeeHistoryEntry,
  ScoreTrend,
  RatingScale,
  Competency,
} from './dto';

const BASE = '/api/v1/evaluations';

// =============== TEMPLATES ===============

export async function listTemplates(params?: {
  type?: string;
  isActive?: boolean;
}): Promise<EvaluationTemplate[]> {
  return http.get(`${BASE}/templates`, { auth: true, params });
}

export async function getTemplate(id: string): Promise<EvaluationTemplate> {
  return http.get(`${BASE}/templates/${id}`, { auth: true });
}

export async function createTemplate(data: CreateTemplateDto): Promise<EvaluationTemplate> {
  return http.post(`${BASE}/templates`, data, { auth: true });
}

export async function updateTemplate(
  id: string,
  data: Partial<CreateTemplateDto>
): Promise<EvaluationTemplate> {
  return http.put(`${BASE}/templates/${id}`, data, { auth: true });
}

export async function deleteTemplate(id: string): Promise<{ success: boolean }> {
  return http.delete(`${BASE}/templates/${id}`, { auth: true });
}

export async function getDefaultCompetencies(): Promise<{
  technical: Competency[];
  soft: Competency[];
  leadership: Competency[];
}> {
  return http.get(`${BASE}/templates/defaults/competencies`, { auth: true });
}

export async function getDefaultRatingScales(): Promise<{
  scale1to5: { min: number; max: number; scales: RatingScale[] };
  scale1to10: { min: number; max: number; scales: RatingScale[] };
}> {
  return http.get(`${BASE}/templates/defaults/rating-scales`, { auth: true });
}

// =============== CYCLES ===============

export async function listCycles(params?: { status?: string }): Promise<EvaluationCycle[]> {
  return http.get(`${BASE}/cycles`, { auth: true, params });
}

export async function getCycle(id: string): Promise<EvaluationCycle> {
  return http.get(`${BASE}/cycles/${id}`, { auth: true });
}

export async function createCycle(data: CreateCycleDto): Promise<EvaluationCycle> {
  return http.post(`${BASE}/cycles`, data, { auth: true });
}

export async function launchCycle(id: string, data: LaunchCycleDto): Promise<{
  cycle: EvaluationCycle;
  assignedCount: number;
}> {
  return http.post(`${BASE}/cycles/${id}/launch`, data, { auth: true });
}

// =============== EVALUATIONS ===============

export async function listEvaluations(params?: {
  cycleId?: string;
  evaluatedEmployeeId?: string;
  evaluatorId?: string;
  status?: string;
}): Promise<EvaluationInstance[]> {
  return http.get(`${BASE}/evaluations`, { auth: true, params });
}

export async function getEvaluation(id: string): Promise<EvaluationInstance> {
  return http.get(`${BASE}/evaluations/${id}`, { auth: true });
}

export async function updateEvaluation(
  id: string,
  data: UpdateEvaluationDto
): Promise<EvaluationInstance> {
  return http.put(`${BASE}/evaluations/${id}`, data, { auth: true });
}

export async function submitEvaluation(id: string): Promise<EvaluationInstance> {
  return http.post(`${BASE}/evaluations/${id}/submit`, {}, { auth: true });
}

export async function managerReviewEvaluation(
  id: string,
  data: ManagerReviewDto
): Promise<EvaluationInstance> {
  return http.post(`${BASE}/evaluations/${id}/manager-review`, data, { auth: true });
}

export async function hrReviewEvaluation(
  id: string,
  data: HRReviewDto
): Promise<EvaluationInstance> {
  return http.post(`${BASE}/evaluations/${id}/hr-review`, data, { auth: true });
}

export async function getEmployeeSummary(params: {
  employeeId: string;
  cycleId: string;
}): Promise<{
  employeeId: string;
  cycleId: string;
  totalEvaluations: number;
  completedEvaluations: number;
  pendingEvaluations: number;
  averageScore: number;
  selfEvaluation: {
    status: string;
    overallRating?: number;
  } | null;
  managerEvaluation: {
    status: string;
    overallRating?: number;
  } | null;
  peerEvaluationsCount: number;
  evaluations: EvaluationInstance[];
}> {
  const { employeeId, cycleId } = params;
  return http.get(`${BASE}/evaluations/employee/${employeeId}/cycle/${cycleId}/summary`, {
    auth: true,
  });
}

// =============== ANALYTICS ===============

export async function getCycleAnalytics(cycleId: string): Promise<CycleAnalytics> {
  return http.get(`${BASE}/analytics/cycle/${cycleId}`, { auth: true });
}

export async function getDepartmentComparison(cycleId: string): Promise<DepartmentComparison[]> {
  return http.get(`${BASE}/analytics/cycle/${cycleId}/departments`, { auth: true });
}

export async function getTopPerformers(
  cycleId: string,
  limit?: number
): Promise<TopPerformer[]> {
  return http.get(`${BASE}/analytics/cycle/${cycleId}/top-performers`, {
    auth: true,
    params: { limit },
  });
}

export async function getCompetencyAnalysis(cycleId: string): Promise<CompetencyAnalysis> {
  return http.get(`${BASE}/analytics/cycle/${cycleId}/competencies`, { auth: true });
}

export async function getEmployeeHistory(
  employeeId: string,
  limit?: number
): Promise<EmployeeHistoryEntry[]> {
  return http.get(`${BASE}/analytics/employee/${employeeId}/history`, {
    auth: true,
    params: { limit },
  });
}

export async function getScoreTrends(params?: {
  employeeId?: string;
  department?: string;
  limit?: number;
}): Promise<ScoreTrend[]> {
  return http.get(`${BASE}/analytics/trends`, { auth: true, params });
}
