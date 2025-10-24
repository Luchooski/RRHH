import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Plus,
  Play,
  Star,
  Trash2,
  Eye,
  Globe,
  Lock,
  Download,
  FileText,
  Calendar,
  Users,
  Clock,
  Briefcase,
} from 'lucide-react';
import { http } from '@/lib/api';
import { downloadFile, buildUrlWithParams } from '@/lib/download';

const REPORT_TYPE_ICONS: Record<string, any> = {
  attendance: Clock,
  leaves: Calendar,
  employees: Users,
  payroll: Briefcase,
};

const REPORT_TYPE_COLORS: Record<string, string> = {
  attendance: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
  leaves: 'text-green-600 bg-green-50 dark:bg-green-950/30',
  employees: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30',
  payroll: 'text-orange-600 bg-orange-50 dark:bg-orange-950/30',
};

export default function CustomReportsPage() {
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  // Fetch custom reports
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['custom-reports'],
    queryFn: () => http.get('/api/v1/reports/custom', { auth: true, params: { includePublic: true } }),
  });

  // Execute report mutation
  const executeMutation = useMutation({
    mutationFn: (reportId: string) =>
      http.post(`/api/v1/reports/custom/${reportId}/execute`, {}, { auth: true }),
    onSuccess: (data) => {
      setReportData(data);
    },
  });

  // Toggle favorite mutation
  const favoriteMutation = useMutation({
    mutationFn: (reportId: string) =>
      http.post(`/api/v1/reports/custom/${reportId}/favorite`, {}, { auth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-reports'] });
    },
  });

  // Delete report mutation
  const deleteMutation = useMutation({
    mutationFn: (reportId: string) => http.delete(`/api/v1/reports/custom/${reportId}`, { auth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-reports'] });
      if (selectedReport && deleteMutation.variables === selectedReport._id) {
        setSelectedReport(null);
        setReportData(null);
      }
    },
  });

  const handleExecute = (report: any) => {
    setSelectedReport(report);
    setReportData(null);
    executeMutation.mutate(report._id);
  };

  const handleExport = async (format: 'xlsx' | 'pdf') => {
    if (!reportData || !selectedReport) return;

    setDownloading(format);
    try {
      const token = localStorage.getItem('token');
      const { reportType, filters } = selectedReport;

      let url = '';
      let filename = '';

      if (reportType === 'attendance' && filters.dateRange) {
        url = buildUrlWithParams(`/api/v1/reports/attendance/summary.${format}`, {
          from: filters.dateRange.from,
          to: filters.dateRange.to,
          employeeId: filters.employeeId,
          department: filters.department,
        });
        filename = `${selectedReport.name.replace(/\s+/g, '-')}.${format}`;
      } else if (reportType === 'leaves') {
        url = buildUrlWithParams(`/api/v1/reports/leaves/balance.${format}`, {
          employeeId: filters.employeeId,
          department: filters.department,
        });
        filename = `${selectedReport.name.replace(/\s+/g, '-')}.${format}`;
      } else if (reportType === 'employees') {
        url = buildUrlWithParams(`/api/v1/reports/employees/demographics.${format}`, {
          status: filters.status || 'active',
        });
        filename = `${selectedReport.name.replace(/\s+/g, '-')}.${format}`;
      }

      if (url) {
        await downloadFile(url, filename, token || undefined);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Error al exportar el reporte');
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = (reportId: string) => {
    if (confirm('¿Estás seguro de eliminar este reporte?')) {
      deleteMutation.mutate(reportId);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reportes Personalizados</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            Crea y ejecuta reportes configurados según tus necesidades
          </p>
        </div>
        <Link
          to="/reportes/crear"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Crear Reporte
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Reports List */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h3 className="text-lg font-semibold mb-4">Mis Reportes ({reports.length})</h3>

            {isLoading && (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-zinc-500 mt-4">Cargando reportes...</p>
              </div>
            )}

            {!isLoading && reports.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
                <p className="text-zinc-500">No hay reportes personalizados</p>
                <Link
                  to="/reportes/crear"
                  className="text-blue-600 hover:underline mt-2 inline-block"
                >
                  Crear mi primer reporte
                </Link>
              </div>
            )}

            {!isLoading && reports.length > 0 && (
              <div className="space-y-2">
                {reports.map((report: any) => {
                  const Icon = REPORT_TYPE_ICONS[report.reportType] || FileText;
                  const colorClass = REPORT_TYPE_COLORS[report.reportType] || '';

                  return (
                    <div
                      key={report._id}
                      className={`p-3 rounded-lg border-2 transition cursor-pointer ${
                        selectedReport?._id === report._id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                      }`}
                      onClick={() => setSelectedReport(report)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${colorClass}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">{report.name}</h4>
                            {report.description && (
                              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                                {report.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {report.isFavorite && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                          {report.isPublic ? (
                            <Globe className="w-4 h-4 text-zinc-400" />
                          ) : (
                            <Lock className="w-4 h-4 text-zinc-400" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExecute(report);
                          }}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        >
                          <Play className="w-3 h-3" />
                          Ejecutar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            favoriteMutation.mutate(report._id);
                          }}
                          className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              report.isFavorite
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-zinc-400'
                            }`}
                          />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(report._id);
                          }}
                          className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-950/30 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Report Details & Results */}
        <div className="lg:col-span-2">
          {!selectedReport && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
              <Eye className="w-16 h-16 text-zinc-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-zinc-600 dark:text-zinc-400">
                Selecciona un reporte
              </h3>
              <p className="text-zinc-500 mt-2">
                Haz clic en un reporte de la lista para ver sus detalles y ejecutarlo
              </p>
            </div>
          )}

          {selectedReport && (
            <div className="space-y-6">
              {/* Report Info */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedReport.name}</h2>
                    {selectedReport.description && (
                      <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                        {selectedReport.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {reportData && (
                      <>
                        <button
                          onClick={() => handleExport('xlsx')}
                          disabled={downloading !== null}
                          className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                        >
                          {downloading === 'xlsx' ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                          Excel
                        </button>
                        <button
                          onClick={() => handleExport('pdf')}
                          disabled={downloading !== null}
                          className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                        >
                          {downloading === 'pdf' ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          PDF
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-600 dark:text-zinc-400">Tipo:</span>
                    <span className="ml-2 font-medium capitalize">{selectedReport.reportType}</span>
                  </div>
                  <div>
                    <span className="text-zinc-600 dark:text-zinc-400">Campos:</span>
                    <span className="ml-2 font-medium">{selectedReport.fields.length}</span>
                  </div>
                  <div>
                    <span className="text-zinc-600 dark:text-zinc-400">Creado por:</span>
                    <span className="ml-2 font-medium">{selectedReport.userName}</span>
                  </div>
                  <div>
                    <span className="text-zinc-600 dark:text-zinc-400">Visibilidad:</span>
                    <span className="ml-2 font-medium">
                      {selectedReport.isPublic ? 'Público' : 'Privado'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <h3 className="text-lg font-semibold mb-4">Resultados</h3>

                {executeMutation.isPending && (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-zinc-500 mt-4">Ejecutando reporte...</p>
                  </div>
                )}

                {executeMutation.isError && (
                  <div className="text-center py-12 text-red-600">
                    Error al ejecutar el reporte: {(executeMutation.error as Error).message}
                  </div>
                )}

                {reportData && (
                  <div className="overflow-x-auto">
                    <pre className="text-sm bg-zinc-50 dark:bg-zinc-800 p-4 rounded-lg overflow-auto max-h-[600px]">
                      {JSON.stringify(reportData.data, null, 2)}
                    </pre>
                  </div>
                )}

                {!reportData && !executeMutation.isPending && !executeMutation.isError && (
                  <p className="text-center py-12 text-zinc-500">
                    Haz clic en "Ejecutar" para ver los resultados
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
