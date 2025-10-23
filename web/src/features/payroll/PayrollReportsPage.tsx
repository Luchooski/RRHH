import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, DollarSign, Users, FileText, Download, Calendar } from 'lucide-react';
import { http } from '@/lib/api';

export default function PayrollReportsPage() {
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [groupBy, setGroupBy] = useState<'none' | 'department' | 'type'>('none');

  // Fetch summary report
  const { data: summaryData, isLoading: loadingSummary } = useQuery({
    queryKey: ['payroll-summary', period, groupBy],
    queryFn: () =>
      http.get('/api/v1/payrolls/reports/summary', {
        auth: true,
        params: { period, groupBy },
      }),
  });

  // Fetch taxes report
  const { data: taxesData, isLoading: loadingTaxes } = useQuery({
    queryKey: ['payroll-taxes', period],
    queryFn: () =>
      http.get('/api/v1/payrolls/reports/taxes', {
        auth: true,
        params: { period },
      }),
  });

  const summary = summaryData || {};
  const taxes = taxesData || {};

  // Colors for charts
  const COLORS = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // yellow
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
  ];

  // Prepare data for charts
  const departmentChartData =
    groupBy === 'department' && summary.groups
      ? summary.groups.map((g: any, idx: number) => ({
          name: g.department,
          value: g.totalNet,
          employees: g.totalEmployees,
          color: COLORS[idx % COLORS.length],
        }))
      : [];

  const taxesChartData = taxes.employerContributions
    ? [
        { name: 'Jubilación', value: taxes.employerContributions.jubilacion },
        { name: 'Obra Social', value: taxes.employerContributions.obraSocial },
        { name: 'PAMI', value: taxes.employerContributions.pami },
        { name: 'ART', value: taxes.employerContributions.art },
        { name: 'Asignaciones', value: taxes.employerContributions.asignaciones },
        { name: 'Beneficios', value: taxes.employerContributions.benefits },
      ].filter((item) => item.value > 0)
    : [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reportes de Nómina</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            Análisis consolidado y reportes de impuestos
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          <Download className="w-4 h-4" />
          Exportar
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Período
            </label>
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value.slice(0, 7))}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Agrupar por</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800"
            >
              <option value="none">Sin agrupación</option>
              <option value="department">Departamento</option>
              <option value="type">Tipo de liquidación</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPIs Grid */}
      {groupBy === 'none' && summary.totalEmployees >= 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            icon={<Users className="w-5 h-5" />}
            title="Total Empleados"
            value={summary.totalEmployees || 0}
            color="blue"
          />
          <KPICard
            icon={<DollarSign className="w-5 h-5" />}
            title="Bruto Total"
            value={`$${(summary.totalGross || 0).toLocaleString()}`}
            color="green"
          />
          <KPICard
            icon={<TrendingUp className="w-5 h-5" />}
            title="Deducciones Total"
            value={`$${(summary.totalDeductions || 0).toLocaleString()}`}
            color="yellow"
          />
          <KPICard
            icon={<FileText className="w-5 h-5" />}
            title="Neto Total"
            value={`$${(summary.totalNet || 0).toLocaleString()}`}
            color="purple"
            subtitle="A pagar"
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        {groupBy === 'department' && departmentChartData.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h3 className="text-lg font-semibold mb-4">Distribución por Departamento</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentChartData}>
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip
                  formatter={(value: any, name: string) => {
                    if (name === 'value') return [`$${Number(value).toLocaleString()}`, 'Neto Total'];
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar dataKey="value" fill="#3b82f6" name="Neto Total" />
                <Bar dataKey="employees" fill="#10b981" name="Empleados" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Taxes Pie Chart */}
        {taxesChartData.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h3 className="text-lg font-semibold mb-4">Aportes Patronales</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={taxesChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: $${entry.value.toLocaleString()}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {taxesChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `$${Number(value).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Taxes Detail */}
      {taxes.totalEmployees >= 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h3 className="text-lg font-semibold mb-4">Detalle de Impuestos y Contribuciones</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Employee Deductions */}
            <div>
              <h4 className="font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                Deducciones del Empleado
              </h4>
              <div className="space-y-2">
                <DetailRow
                  label="Jubilación (11%)"
                  value={`$${(taxes.employeeDeductions?.jubilacion || 0).toLocaleString()}`}
                />
                <DetailRow
                  label="Ley 19032 (3%)"
                  value={`$${(taxes.employeeDeductions?.ley19032 || 0).toLocaleString()}`}
                />
                <DetailRow
                  label="Obra Social (3%)"
                  value={`$${(taxes.employeeDeductions?.obraSocial || 0).toLocaleString()}`}
                />
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 font-semibold">
                  <DetailRow
                    label="Total Deducciones"
                    value={`$${(taxes.employeeDeductions?.total || 0).toLocaleString()}`}
                  />
                </div>
              </div>
            </div>

            {/* Employer Contributions */}
            <div>
              <h4 className="font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                Aportes Patronales
              </h4>
              <div className="space-y-2">
                <DetailRow
                  label="Jubilación (10.17%)"
                  value={`$${(taxes.employerContributions?.jubilacion || 0).toLocaleString()}`}
                />
                <DetailRow
                  label="Obra Social (6%)"
                  value={`$${(taxes.employerContributions?.obraSocial || 0).toLocaleString()}`}
                />
                <DetailRow
                  label="PAMI (1.5%)"
                  value={`$${(taxes.employerContributions?.pami || 0).toLocaleString()}`}
                />
                <DetailRow
                  label="ART (3%)"
                  value={`$${(taxes.employerContributions?.art || 0).toLocaleString()}`}
                />
                <DetailRow
                  label="Asignaciones (4.44%)"
                  value={`$${(taxes.employerContributions?.asignaciones || 0).toLocaleString()}`}
                />
                {(taxes.employerContributions?.benefits || 0) > 0 && (
                  <DetailRow
                    label="Beneficios"
                    value={`$${(taxes.employerContributions?.benefits || 0).toLocaleString()}`}
                  />
                )}
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 font-semibold">
                  <DetailRow
                    label="Total Aportes"
                    value={`$${(taxes.employerContributions?.total || 0).toLocaleString()}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status by groups */}
      {groupBy !== 'none' && summary.groups && summary.groups.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 overflow-x-auto">
          <h3 className="text-lg font-semibold mb-4">
            Detalle por {groupBy === 'department' ? 'Departamento' : 'Tipo'}
          </h3>
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  {groupBy === 'department' ? 'Departamento' : 'Tipo'}
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium">Empleados</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Sueldo Base</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Bruto</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Deducciones</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Neto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {summary.groups.map((group: any, idx: number) => (
                <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                  <td className="px-4 py-3 font-medium">
                    {group.department || group.type || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-right">{group.totalEmployees}</td>
                  <td className="px-4 py-3 text-right">
                    ${(group.totalBaseSalary || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">${(group.totalGross || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">
                    ${(group.totalDeductions || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    ${(group.totalNet || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Loading states */}
      {(loadingSummary || loadingTaxes) && (
        <div className="text-center py-12 text-zinc-500">
          Cargando reportes...
        </div>
      )}
    </div>
  );
}

function KPICard({
  icon,
  title,
  value,
  color,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  color: string;
  subtitle?: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900',
    green:
      'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900',
    yellow:
      'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900',
    purple:
      'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900',
  };

  return (
    <div
      className={`rounded-xl border p-6 ${
        colorClasses[color as keyof typeof colorClasses]
      }`}
    >
      <div className="flex items-center gap-3 mb-2">{icon}</div>
      <div className="text-sm font-medium opacity-80">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {subtitle && <div className="text-xs opacity-70 mt-1">{subtitle}</div>}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-zinc-600 dark:text-zinc-400">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
