import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Toolbar } from '@/components/ui/Toolbar';
import {
  TrendingUp,
  Users,
  Award,
  Target,
  BarChart3,
  AlertCircle,
} from 'lucide-react';
import * as api from './api';

interface AnalyticsDashboardPageProps {
  cycleId: string;
}

export default function AnalyticsDashboardPage({ cycleId }: AnalyticsDashboardPageProps) {
  const { data: cycle } = useQuery({
    queryKey: ['evaluation-cycle', cycleId],
    queryFn: () => api.getCycle(cycleId),
  });

  const { data: analytics } = useQuery({
    queryKey: ['cycle-analytics', cycleId],
    queryFn: () => api.getCycleAnalytics(cycleId),
  });

  const { data: departments } = useQuery({
    queryKey: ['department-comparison', cycleId],
    queryFn: () => api.getDepartmentComparison(cycleId),
  });

  const { data: topPerformers } = useQuery({
    queryKey: ['top-performers', cycleId],
    queryFn: () => api.getTopPerformers(cycleId, 10),
  });

  const { data: competencyAnalysis } = useQuery({
    queryKey: ['competency-analysis', cycleId],
    queryFn: () => api.getCompetencyAnalysis(cycleId),
  });

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 4) return 'bg-green-100';
    if (score >= 3) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="container space-y-4 pb-8">
      <Toolbar
        title={`Analytics: ${cycle?.name || 'Cargando...'}`}
        subtitle={cycle ? `${new Date(cycle.startDate).toLocaleDateString()} - ${new Date(cycle.endDate).toLocaleDateString()}` : undefined}
      />

      {/* Overview Stats */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Tasa de Completitud</div>
                  <div className="text-2xl font-bold">{analytics.completionRate}%</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {analytics.totalCompleted} de {analytics.totalEvaluations}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <BarChart3 className="text-blue-600" size={24} />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Puntuación Promedio</div>
                  <div className={`text-2xl font-bold ${getScoreColor(analytics.averageScore)}`}>
                    {analytics.averageScore.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Min: {analytics.minScore} | Max: {analytics.maxScore}
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-full ${getScoreBgColor(analytics.averageScore)} flex items-center justify-center`}>
                  <TrendingUp className={getScoreColor(analytics.averageScore)} size={24} />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Pendientes</div>
                  <div className="text-2xl font-bold">{analytics.totalPending}</div>
                  <div className="text-xs text-gray-600 mt-1">En Progreso: {analytics.totalInProgress}</div>
                </div>
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <AlertCircle className="text-yellow-600" size={24} />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Total Evaluaciones</div>
                  <div className="text-2xl font-bold">{analytics.totalEvaluations}</div>
                  <div className="text-xs text-gray-600 mt-1">Completadas: {analytics.totalCompleted}</div>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Users className="text-purple-600" size={24} />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Score Distribution */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Puntuaciones</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {Object.entries(analytics.scoreDistribution).map(([range, count]) => {
                const total = analytics.totalCompleted;
                const percentage = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={range}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{range}</span>
                      <span className="text-gray-600">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* By Role */}
        {analytics && (
          <Card>
            <CardHeader>
              <CardTitle>Por Tipo de Evaluador</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {Object.entries(analytics.avgByRole).map(([role, avg]) => {
                  const count = analytics.byRole[role as keyof typeof analytics.byRole];
                  const roleLabels = {
                    self: 'Auto-evaluación',
                    manager: 'Jefe',
                    peer: 'Par',
                    subordinate: 'Subordinado',
                  };
                  return (
                    <div key={role}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">
                          {roleLabels[role as keyof typeof roleLabels]}
                        </span>
                        <span className={`font-bold ${getScoreColor(avg)}`}>
                          {avg > 0 ? avg.toFixed(2) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${avg > 0 ? (avg / 5) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-12 text-right">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Top Performers */}
        {topPerformers && topPerformers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="text-yellow-500" size={20} />
                Top 10 Desempeño
              </CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-2">
                {topPerformers.slice(0, 10).map((performer, idx) => (
                  <div
                    key={performer.employeeId}
                    className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        idx === 0 ? 'bg-yellow-400 text-white' :
                        idx === 1 ? 'bg-gray-300 text-gray-700' :
                        idx === 2 ? 'bg-orange-400 text-white' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-medium">{performer.employeeName}</div>
                        {performer.position && (
                          <div className="text-xs text-gray-500">{performer.position}</div>
                        )}
                      </div>
                    </div>
                    <div className={`font-bold ${getScoreColor(performer.averageScore)}`}>
                      {performer.averageScore.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Department Comparison */}
      {departments && departments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Comparación por Departamento</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Departamento</th>
                    <th className="text-center py-2 px-3">Empleados</th>
                    <th className="text-center py-2 px-3">Evaluaciones</th>
                    <th className="text-center py-2 px-3">Promedio</th>
                    <th className="text-center py-2 px-3">Min</th>
                    <th className="text-center py-2 px-3">Max</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept) => (
                    <tr key={dept.department} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-3 font-medium">{dept.department}</td>
                      <td className="py-3 px-3 text-center">{dept.totalEmployees}</td>
                      <td className="py-3 px-3 text-center">{dept.totalEvaluations}</td>
                      <td className={`py-3 px-3 text-center font-bold ${getScoreColor(dept.averageScore)}`}>
                        {dept.averageScore.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center text-gray-600">{dept.minScore.toFixed(2)}</td>
                      <td className="py-3 px-3 text-center text-gray-600">{dept.maxScore.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Competency Analysis */}
      {competencyAnalysis && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Strengths */}
          {competencyAnalysis.strengths.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <Target size={20} />
                  Fortalezas
                </CardTitle>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {competencyAnalysis.strengths.map((comp) => (
                    <div key={comp.competencyId} className="border-l-4 border-green-500 pl-3">
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-medium">{comp.competencyName}</div>
                        <div className="text-green-600 font-bold">{comp.averageScore.toFixed(2)}</div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {comp.category} | {comp.totalRatings} evaluaciones
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Weaknesses */}
          {competencyAnalysis.weaknesses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <AlertCircle size={20} />
                  Áreas de Mejora
                </CardTitle>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {competencyAnalysis.weaknesses.map((comp) => (
                    <div key={comp.competencyId} className="border-l-4 border-orange-500 pl-3">
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-medium">{comp.competencyName}</div>
                        <div className="text-orange-600 font-bold">{comp.averageScore.toFixed(2)}</div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {comp.category} | {comp.totalRatings} evaluaciones
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
