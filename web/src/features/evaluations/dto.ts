// Evaluation DTOs matching backend models

export interface RatingScale {
  value: number;
  label: string;
  description?: string;
  color?: string;
}

export interface Competency {
  id: string;
  name: string;
  description?: string;
  category: 'technical' | 'soft' | 'leadership' | 'custom';
  weight: number;
  required: boolean;
}

export interface Objective {
  id: string;
  title: string;
  description?: string;
  weight: number;
  required: boolean;
}

export interface GeneralQuestion {
  id: string;
  question: string;
  required: boolean;
}

export interface EvaluationTemplate {
  _id: string;
  tenantId: string;
  name: string;
  description?: string;
  type: 'self' | 'manager' | '360' | 'quarterly' | 'annual' | 'probation';
  ratingScale: {
    min: number;
    max: number;
    scales: RatingScale[];
  };
  competencies: Competency[];
  objectives: Objective[];
  generalQuestions: GeneralQuestion[];
  config: {
    allowSelfEvaluation: boolean;
    requireManagerApproval: boolean;
    requireHRApproval: boolean;
    allowComments: boolean;
    anonymousFor360: boolean;
  };
  applicableTo: {
    departments?: string[];
    positions?: string[];
    employmentTypes?: string[];
    all: boolean;
  };
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationCycle {
  _id: string;
  tenantId: string;
  name: string;
  description?: string;
  templateId: string;
  startDate: string;
  endDate: string;
  evaluationDeadline: string;
  status: 'draft' | 'active' | 'in-progress' | 'completed' | 'cancelled';
  stats: {
    totalAssigned: number;
    totalCompleted: number;
    totalPending: number;
    totalInProgress: number;
    averageScore?: number;
    completionRate: number;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompetencyRating {
  competencyId: string;
  rating: number;
  comment?: string;
}

export interface ObjectiveRating {
  objectiveId: string;
  rating: number;
  achievement?: string;
  comment?: string;
}

export interface GeneralAnswer {
  questionId: string;
  answer: string;
}

export interface Review {
  reviewedAt: string;
  reviewedBy: string;
  reviewerName: string;
  approved: boolean;
  comments?: string;
  overallRating?: number;
}

export interface EvaluationInstance {
  _id: string;
  tenantId: string;
  cycleId: string;
  templateId: string;
  evaluatedEmployeeId: string;
  evaluatedEmployeeName: string;
  evaluatedEmployeeDepartment?: string;
  evaluatedEmployeePosition?: string;
  evaluatorId: string;
  evaluatorName: string;
  evaluatorRole: 'self' | 'manager' | 'peer' | 'subordinate';
  competencyRatings: CompetencyRating[];
  objectiveRatings: ObjectiveRating[];
  generalAnswers: GeneralAnswer[];
  overallRating?: number;
  overallComment?: string;
  status: 'pending' | 'in-progress' | 'submitted' | 'manager-review' | 'hr-review' | 'completed';
  submittedAt?: string;
  submittedBy?: string;
  managerReview?: Review;
  hrReview?: Review;
  completedAt?: string;
  dueDate: string;
  startedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Analytics DTOs
export interface CycleAnalytics {
  cycleId: string;
  totalEvaluations: number;
  totalCompleted: number;
  totalPending: number;
  totalInProgress: number;
  completionRate: number;
  averageScore: number;
  maxScore: number;
  minScore: number;
  scoreDistribution: {
    '1-2': number;
    '2-3': number;
    '3-4': number;
    '4-5': number;
  };
  byRole: {
    self: number;
    manager: number;
    peer: number;
    subordinate: number;
  };
  avgByRole: {
    self: number;
    manager: number;
    peer: number;
    subordinate: number;
  };
}

export interface DepartmentComparison {
  department: string;
  totalEmployees: number;
  totalEvaluations: number;
  averageScore: number;
  maxScore: number;
  minScore: number;
}

export interface TopPerformer {
  employeeId: string;
  employeeName: string;
  department?: string;
  position?: string;
  averageScore: number;
  totalEvaluations: number;
  evaluationBreakdown: {
    evaluatorRole: string;
    overallRating: number;
  }[];
}

export interface CompetencyAnalysisResult {
  competencyId: string;
  competencyName: string;
  category: string;
  weight: number;
  totalRatings: number;
  averageScore: number;
  maxScore: number;
  minScore: number;
}

export interface CompetencyAnalysis {
  competencies: CompetencyAnalysisResult[];
  strengths: CompetencyAnalysisResult[];
  weaknesses: CompetencyAnalysisResult[];
}

export interface EmployeeHistoryEntry {
  cycleId: string;
  cycleName: string;
  startDate?: string;
  endDate?: string;
  totalEvaluations: number;
  averageScore: number;
  evaluations: {
    evaluationId: string;
    evaluatorRole: string;
    evaluatorName: string;
    overallRating?: number;
    completedAt?: string;
  }[];
}

export interface ScoreTrend {
  cycleId: string;
  cycleName: string;
  endDate: string;
  averageScore: number;
  totalEvaluations: number;
}

// Form DTOs
export interface CreateTemplateDto {
  name: string;
  description?: string;
  type: 'self' | 'manager' | '360' | 'quarterly' | 'annual' | 'probation';
  ratingScale: {
    min: number;
    max: number;
    scales: RatingScale[];
  };
  competencies: Omit<Competency, 'id'>[];
  objectives: Omit<Objective, 'id'>[];
  generalQuestions: Omit<GeneralQuestion, 'id'>[];
  config: {
    allowSelfEvaluation: boolean;
    requireManagerApproval: boolean;
    requireHRApproval: boolean;
    allowComments: boolean;
    anonymousFor360: boolean;
  };
  applicableTo: {
    departments?: string[];
    positions?: string[];
    employmentTypes?: string[];
    all: boolean;
  };
}

export interface CreateCycleDto {
  name: string;
  description?: string;
  templateId: string;
  startDate: string;
  endDate: string;
  evaluationDeadline: string;
}

export interface LaunchCycleDto {
  employeeIds?: string[];
  includeSelfEvaluation?: boolean;
}

export interface UpdateEvaluationDto {
  competencyRatings?: CompetencyRating[];
  objectiveRatings?: ObjectiveRating[];
  generalAnswers?: GeneralAnswer[];
  overallComment?: string;
}

export interface ManagerReviewDto {
  approved: boolean;
  comments?: string;
  overallRating?: number;
}

export interface HRReviewDto {
  approved: boolean;
  comments?: string;
}
