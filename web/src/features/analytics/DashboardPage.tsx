import { useState } from 'react';
import {
  Users, Briefcase, UserPlus, Calendar, DollarSign,
  TrendingUp, Clock, AlertCircle, CheckCircle, XCircle,
  BarChart3, Award, Gift
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useDashboardKPIs, useNewHiresTrend, useApplicationsTrend, useAttendanceTrend } from './hooks';
import { CANDIDATE_STAGE_LABELS, LEAVE_TYPE_LABELS, BENEFIT_TYPE_LABELS } from './dto';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';

export default function DashboardPage() {
  const [newHiresMonths, setNewHiresMonths] = useState(6);
  const [applicationsMonths, setApplicationsMonths] = useState(6);
  const [attendanceDays, setAttendanceDays] = useState(30);

  const { data: kpis, isLoading, error } = useDashboardKPIs();
  const { data: newHiresTrend } = useNewHiresTrend({ months: newHiresMonths });
  const { data: applicationsTrend } = useApplicationsTrend({ months: applicationsMonths });
  const { data: attendanceTrend } = useAttendanceTrend({ days: attendanceDays });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando métricas del dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600">Error al cargar las métricas del dashboard</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!kpis) return null;

  // Preparar datos para gráficos
  const candidatesByStageData = Object.entries(kpis.recruitment.candidatesByStage).map(([stage, count]) => ({
    name: CANDIDATE_STAGE_LABELS[stage] || stage,
    value: count,
  }));

  const departmentData = kpis.employees.byDepartment.map((item) => ({
    name: item.department || 'Sin Departamento',
    count: item.count,
  }));

  const leavesByTypeData = Object.entries(kpis.leaves.byType).map(([type, count]) => ({
    name: LEAVE_TYPE_LABELS[type] || type,
    value: count as number,
  }));

  const benefitsByTypeData = Object.entries(kpis.benefits.byType).map(([type, count]) => ({
    name: BENEFIT_TYPE_LABELS[type] || type,
    value: count as number,
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard de Analíticas</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Métricas y tendencias clave del sistema de RRHH
        </p>
      </div>

      {/* Recruitment KPIs */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-blue-600" />
          Reclutamiento
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Candidatos Totales</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                    {kpis.recruitment.totalCandidates}
                  </p>
                </div>
                <Users className="h-10 w-10 text-blue-600/50" />
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">Vacantes Activas</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300 mt-1">
                    {kpis.recruitment.activeVacancies}
                  </p>
                </div>
                <Briefcase className="h-10 w-10 text-green-600/50" />
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Aplicaciones (Mes)</p>
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-300 mt-1">
                    {kpis.recruitment.applicationsThisMonth}
                  </p>
                </div>
                <TrendingUp className="h-10 w-10 text-purple-600/50" />
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Tiempo Prom. Contratación</p>
                  <p className="text-3xl font-bold text-orange-700 dark:text-orange-300 mt-1">
                    {kpis.recruitment.avgTimeToHire} <span className="text-sm">días</span>
                  </p>
                </div>
                <Clock className="h-10 w-10 text-orange-600/50" />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Candidates by Stage Chart */}
        {candidatesByStageData.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <h3 className="text-lg font-semibold">Candidatos por Etapa</h3>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={candidatesByStageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        )}
      </section>

      {/* Employees KPIs */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-green-600" />
          Empleados
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">Empleados Activos</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300 mt-1">
                    {kpis.employees.totalActive}
                  </p>
                </div>
                <Users className="h-10 w-10 text-green-600/50" />
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-800/20">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Nuevas Contrataciones (Mes)</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                    {kpis.employees.newHiresThisMonth}
                  </p>
                </div>
                <UserPlus className="h-10 w-10 text-blue-600/50" />
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-900/20 dark:to-blue-800/20">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Nuevas Contrataciones (Año)</p>
                  <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-300 mt-1">
                    {kpis.employees.newHiresThisYear}
                  </p>
                </div>
                <Award className="h-10 w-10 text-indigo-600/50" />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Employees by Department Chart */}
        {departmentData.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <h3 className="text-lg font-semibold">Empleados por Departamento</h3>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        )}
      </section>

      {/* Attendance KPIs */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-purple-600" />
          Asistencia
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Tasa de Asistencia</p>
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-300 mt-1">
                    {kpis.attendance.avgAttendanceRate.toFixed(1)}%
                  </p>
                </div>
                <CheckCircle className="h-10 w-10 text-purple-600/50" />
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Horas Totales (Mes)</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                    {kpis.attendance.totalHoursThisMonth}
                  </p>
                </div>
                <Clock className="h-10 w-10 text-blue-600/50" />
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Llegadas Tarde</p>
                  <p className="text-3xl font-bold text-orange-700 dark:text-orange-300 mt-1">
                    {kpis.attendance.lateArrivals}
                  </p>
                </div>
                <AlertCircle className="h-10 w-10 text-orange-600/50" />
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">Salidas Tempranas</p>
                  <p className="text-3xl font-bold text-red-700 dark:text-red-300 mt-1">
                    {kpis.attendance.earlyDepartures}
                  </p>
                </div>
                <XCircle className="h-10 w-10 text-red-600/50" />
              </div>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* Leaves KPIs */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-amber-600" />
          Licencias
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-800/20">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Pendientes de Aprobación</p>
                  <p className="text-3xl font-bold text-amber-700 dark:text-amber-300 mt-1">
                    {kpis.leaves.pendingApproval}
                  </p>
                </div>
                <AlertCircle className="h-10 w-10 text-amber-600/50" />
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">Aprobadas (Mes)</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300 mt-1">
                    {kpis.leaves.approvedThisMonth}
                  </p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-600/50" />
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">Rechazadas (Mes)</p>
                  <p className="text-3xl font-bold text-red-700 dark:text-red-300 mt-1">
                    {kpis.leaves.rejectedThisMonth}
                  </p>
                </div>
                <XCircle className="h-10 w-10 text-red-600/50" />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Leaves by Type Chart */}
        {leavesByTypeData.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <h3 className="text-lg font-semibold">Licencias por Tipo</h3>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={leavesByTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {leavesByTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        )}
      </section>

      {/* Benefits KPIs */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Gift className="h-5 w-5 text-pink-600" />
          Beneficios
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-900/20 dark:to-rose-800/20">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-pink-600 dark:text-pink-400 font-medium">Costo Mensual Total</p>
                  <p className="text-3xl font-bold text-pink-700 dark:text-pink-300 mt-1">
                    ${kpis.benefits.totalMonthlyCost.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-10 w-10 text-pink-600/50" />
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-fuchsia-100 dark:from-purple-900/20 dark:to-fuchsia-800/20">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Asignaciones Activas</p>
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-300 mt-1">
                    {kpis.benefits.activeAssignments}
                  </p>
                </div>
                <Gift className="h-10 w-10 text-purple-600/50" />
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-900/20 dark:to-purple-800/20">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Costo por Empleado</p>
                  <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-300 mt-1">
                    ${kpis.benefits.costPerEmployee.toLocaleString()}
                  </p>
                </div>
                <Users className="h-10 w-10 text-indigo-600/50" />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Benefits by Type Chart */}
        {benefitsByTypeData.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <h3 className="text-lg font-semibold">Beneficios por Tipo</h3>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={benefitsByTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {benefitsByTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        )}
      </section>

      {/* Trends Section */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          Tendencias
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* New Hires Trend */}
          {newHiresTrend && newHiresTrend.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Nuevas Contrataciones</h3>
                  <select
                    value={newHiresMonths}
                    onChange={(e) => setNewHiresMonths(Number(e.target.value))}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                  >
                    <option value={3}>3 meses</option>
                    <option value={6}>6 meses</option>
                    <option value={12}>12 meses</option>
                  </select>
                </div>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={newHiresTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          )}

          {/* Applications Trend */}
          {applicationsTrend && applicationsTrend.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Aplicaciones Recibidas</h3>
                  <select
                    value={applicationsMonths}
                    onChange={(e) => setApplicationsMonths(Number(e.target.value))}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                  >
                    <option value={3}>3 meses</option>
                    <option value={6}>6 meses</option>
                    <option value={12}>12 meses</option>
                  </select>
                </div>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={applicationsTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          )}

          {/* Attendance Trend */}
          {attendanceTrend && attendanceTrend.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Tasa de Asistencia (%)</h3>
                  <select
                    value={attendanceDays}
                    onChange={(e) => setAttendanceDays(Number(e.target.value))}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                  >
                    <option value={7}>7 días</option>
                    <option value={30}>30 días</option>
                    <option value={90}>90 días</option>
                  </select>
                </div>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={attendanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
