import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, Calendar, Users, Clock, Briefcase } from 'lucide-react';
import { http } from '@/lib/api';
import { downloadFile, buildUrlWithParams } from '@/lib/download';

type ReportType = 'attendance' | 'leaves' | 'employees';

export default function AdvancedReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('attendance');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);

  // Fetch report data
  const { data, isLoading, error } = useQuery({
    queryKey: ['advanced-reports', reportType, startDate, endDate, employeeId, department],
    queryFn: async () => {
      const params: Record<string, any> = {};

      if (reportType === 'attendance') {
        params.from = startDate;
        params.to = endDate;
        if (employeeId) params.employeeId = employeeId;
        if (department) params.department = department;
        return http.get('/api/v1/reports/attendance/summary', { auth: true, params });
      } else if (reportType === 'leaves') {
        if (employeeId) params.employeeId = employeeId;
        if (department) params.department = department;
        return http.get('/api/v1/reports/leaves/balance', { auth: true, params });
      } else if (reportType === 'employees') {
        params.status = 'active';
        return http.get('/api/v1/reports/employees/demographics', { auth: true, params });
      }
      return null;
    },
  });

  const handleExport = async (format: 'xlsx' | 'pdf') => {
    setDownloading(format);
    try {
      const token = localStorage.getItem('token');
      const params: Record<string, any> = {};

      if (reportType === 'attendance') {
        params.from = startDate;
        params.to = endDate;
        if (employeeId) params.employeeId = employeeId;
        if (department) params.department = department;

        const url = buildUrlWithParams(
          `/api/v1/reports/attendance/summary.${format}`,
          params
        );
        const filename = `attendance-summary-${startDate}-${endDate}.${format}`;
        await downloadFile(url, filename, token || undefined);
      } else if (reportType === 'leaves') {
        if (employeeId) params.employeeId = employeeId;
        if (department) params.department = department;

        const url = buildUrlWithParams(
          `/api/v1/reports/leaves/balance.${format}`,
          params
        );
        const filename = `leave-balance-${new Date().toISOString().slice(0, 10)}.${format}`;
        await downloadFile(url, filename, token || undefined);
      } else if (reportType === 'employees') {
        params.status = 'active';

        const url = buildUrlWithParams(
          `/api/v1/reports/employees/demographics.${format}`,
          params
        );
        const filename = `employee-demographics-${new Date().toISOString().slice(0, 10)}.${format}`;
        await downloadFile(url, filename, token || undefined);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Error al exportar el reporte');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reportes Avanzados</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            Reportes de asistencia, licencias y demografía de empleados
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('xlsx')}
            disabled={downloading !== null || isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloading === 'xlsx' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Exportar Excel
              </>
            )}
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={downloading !== null || isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloading === 'pdf' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Exportar PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <h3 className="text-lg font-semibold mb-4">Tipo de Reporte</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setReportType('attendance')}
            className={`p-4 rounded-lg border-2 transition ${
              reportType === 'attendance'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
            }`}
          >
            <Clock className="w-8 h-8 mb-2 mx-auto text-blue-600" />
            <h4 className="font-semibold">Asistencia</h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Resumen de asistencia por empleado
            </p>
          </button>
          <button
            onClick={() => setReportType('leaves')}
            className={`p-4 rounded-lg border-2 transition ${
              reportType === 'leaves'
                ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
            }`}
          >
            <Calendar className="w-8 h-8 mb-2 mx-auto text-green-600" />
            <h4 className="font-semibold">Licencias</h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Balance de días de licencia
            </p>
          </button>
          <button
            onClick={() => setReportType('employees')}
            className={`p-4 rounded-lg border-2 transition ${
              reportType === 'employees'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
            }`}
          >
            <Users className="w-8 h-8 mb-2 mx-auto text-purple-600" />
            <h4 className="font-semibold">Demografía</h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Distribución de empleados
            </p>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <h3 className="text-lg font-semibold mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportType === 'attendance' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Fecha Inicio</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Fecha Fin</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800"
                />
              </div>
            </>
          )}
          {reportType !== 'employees' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">ID Empleado (opcional)</label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="Filtrar por empleado..."
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Departamento (opcional)</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Filtrar por departamento..."
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <h3 className="text-lg font-semibold mb-4">Resultados</h3>

        {isLoading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-zinc-500 mt-4">Cargando reporte...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12 text-red-600">
            Error al cargar el reporte: {(error as Error).message}
          </div>
        )}

        {data && !isLoading && (
          <div className="overflow-x-auto">
            {reportType === 'attendance' && (
              <AttendanceTable data={data} />
            )}
            {reportType === 'leaves' && (
              <LeavesTable data={data} />
            )}
            {reportType === 'employees' && (
              <EmployeesTable data={data} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AttendanceTable({ data }: { data: any[] }) {
  return (
    <table className="w-full">
      <thead className="bg-zinc-50 dark:bg-zinc-800/50">
        <tr>
          <th className="px-4 py-3 text-left text-sm font-medium">Empleado</th>
          <th className="px-4 py-3 text-right text-sm font-medium">Días Total</th>
          <th className="px-4 py-3 text-right text-sm font-medium">Horas</th>
          <th className="px-4 py-3 text-right text-sm font-medium">Presente</th>
          <th className="px-4 py-3 text-right text-sm font-medium">Ausente</th>
          <th className="px-4 py-3 text-right text-sm font-medium">Tasa %</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {data.map((row: any, idx: number) => (
          <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
            <td className="px-4 py-3">{row.employeeName || 'N/A'}</td>
            <td className="px-4 py-3 text-right">{row.totalDays || 0}</td>
            <td className="px-4 py-3 text-right">{Math.round((row.totalHours || 0) * 10) / 10}</td>
            <td className="px-4 py-3 text-right">{row.daysPresent || 0}</td>
            <td className="px-4 py-3 text-right">{row.daysAbsent || 0}</td>
            <td className="px-4 py-3 text-right">{Math.round((row.attendanceRate || 0) * 10) / 10}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LeavesTable({ data }: { data: any[] }) {
  const flatData = data.flatMap((emp: any) =>
    Object.entries(emp.balances).map(([type, balance]: [string, any]) => ({
      employeeName: emp.employeeName,
      department: emp.department,
      leaveType: type,
      ...balance,
    }))
  );

  return (
    <table className="w-full">
      <thead className="bg-zinc-50 dark:bg-zinc-800/50">
        <tr>
          <th className="px-4 py-3 text-left text-sm font-medium">Empleado</th>
          <th className="px-4 py-3 text-left text-sm font-medium">Departamento</th>
          <th className="px-4 py-3 text-left text-sm font-medium">Tipo Licencia</th>
          <th className="px-4 py-3 text-right text-sm font-medium">Total</th>
          <th className="px-4 py-3 text-right text-sm font-medium">Usados</th>
          <th className="px-4 py-3 text-right text-sm font-medium">Disponibles</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {flatData.map((row: any, idx: number) => (
          <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
            <td className="px-4 py-3">{row.employeeName}</td>
            <td className="px-4 py-3">{row.department}</td>
            <td className="px-4 py-3">{row.leaveType}</td>
            <td className="px-4 py-3 text-right">{row.total}</td>
            <td className="px-4 py-3 text-right">{row.used}</td>
            <td className="px-4 py-3 text-right">{row.available}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EmployeesTable({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold mb-2">Resumen</h4>
        <p className="text-zinc-600 dark:text-zinc-400">Total Empleados: {data.totalEmployees}</p>
      </div>

      <div>
        <h4 className="font-semibold mb-2">Por Departamento</h4>
        <table className="w-full">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Departamento</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Cantidad</th>
              <th className="px-4 py-3 text-right text-sm font-medium">%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {(data.byDepartment || []).map((row: any, idx: number) => (
              <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                <td className="px-4 py-3">{row.department}</td>
                <td className="px-4 py-3 text-right">{row.count}</td>
                <td className="px-4 py-3 text-right">{row.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
