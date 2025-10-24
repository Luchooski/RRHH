import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Save, Play, ArrowLeft, Plus, X } from 'lucide-react';
import { http } from '@/lib/api';

type ReportType = 'attendance' | 'leaves' | 'employees' | 'payroll';

const REPORT_TYPES = [
  { value: 'attendance', label: 'Asistencia', description: 'Reportes de asistencia y horas trabajadas' },
  { value: 'leaves', label: 'Licencias', description: 'Balance y uso de licencias' },
  { value: 'employees', label: 'Empleados', description: 'Demografía y distribución de empleados' },
  { value: 'payroll', label: 'Nómina', description: 'Reportes de liquidaciones' },
];

const AVAILABLE_FIELDS: Record<ReportType, { value: string; label: string }[]> = {
  attendance: [
    { value: 'employeeName', label: 'Nombre Empleado' },
    { value: 'totalDays', label: 'Total Días' },
    { value: 'totalHours', label: 'Total Horas' },
    { value: 'daysPresent', label: 'Días Presente' },
    { value: 'daysAbsent', label: 'Días Ausente' },
    { value: 'daysLate', label: 'Días Tarde' },
    { value: 'attendanceRate', label: 'Tasa Asistencia %' },
  ],
  leaves: [
    { value: 'employeeName', label: 'Nombre Empleado' },
    { value: 'department', label: 'Departamento' },
    { value: 'leaveType', label: 'Tipo Licencia' },
    { value: 'total', label: 'Total Días' },
    { value: 'used', label: 'Días Usados' },
    { value: 'available', label: 'Días Disponibles' },
  ],
  employees: [
    { value: 'totalEmployees', label: 'Total Empleados' },
    { value: 'byDepartment', label: 'Por Departamento' },
    { value: 'byPosition', label: 'Por Cargo' },
    { value: 'byGender', label: 'Por Género' },
    { value: 'bySeniority', label: 'Por Antigüedad' },
  ],
  payroll: [
    { value: 'employeeName', label: 'Nombre Empleado' },
    { value: 'period', label: 'Período' },
    { value: 'baseSalary', label: 'Sueldo Base' },
    { value: 'grossAmount', label: 'Bruto' },
    { value: 'deductions', label: 'Deducciones' },
    { value: 'netAmount', label: 'Neto' },
  ],
};

export default function ReportBuilderPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [reportType, setReportType] = useState<ReportType>('attendance');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [isPublic, setIsPublic] = useState(false);

  // Date filters for attendance
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  const createMutation = useMutation({
    mutationFn: (data: any) => http.post('/api/v1/reports/custom', data, { auth: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-reports'] });
      navigate('/reportes/personalizados');
    },
  });

  const handleAddField = (field: string) => {
    if (!selectedFields.includes(field)) {
      setSelectedFields([...selectedFields, field]);
    }
  };

  const handleRemoveField = (field: string) => {
    setSelectedFields(selectedFields.filter((f) => f !== field));
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Por favor ingresa un nombre para el reporte');
      return;
    }

    if (selectedFields.length === 0) {
      alert('Por favor selecciona al menos un campo');
      return;
    }

    const reportFilters: any = {};

    if (reportType === 'attendance') {
      reportFilters.dateRange = { from: startDate, to: endDate };
    }

    if (filters.employeeId) reportFilters.employeeId = filters.employeeId;
    if (filters.department) reportFilters.department = filters.department;
    if (filters.status) reportFilters.status = filters.status;

    createMutation.mutate({
      name,
      description,
      reportType,
      fields: selectedFields,
      filters: reportFilters,
      isPublic,
    });
  };

  const availableFields = AVAILABLE_FIELDS[reportType] || [];
  const unselectedFields = availableFields.filter((f) => !selectedFields.includes(f.value));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/reportes/personalizados')}
            className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Reportes
          </button>
          <h1 className="text-3xl font-bold">Crear Reporte Personalizado</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            Configura campos, filtros y opciones para tu reporte
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={createMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Reporte
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h3 className="text-lg font-semibold mb-4">Información Básica</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre del Reporte *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Asistencia Mensual por Departamento"
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Descripción (opcional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe el propósito del reporte..."
                  rows={3}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">Compartir con otros usuarios del tenant</span>
                </label>
              </div>
            </div>
          </div>

          {/* Report Type */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h3 className="text-lg font-semibold mb-4">Tipo de Reporte *</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {REPORT_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => {
                    setReportType(type.value as ReportType);
                    setSelectedFields([]);
                  }}
                  className={`p-4 rounded-lg border-2 text-left transition ${
                    reportType === type.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                  }`}
                >
                  <h4 className="font-semibold">{type.label}</h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h3 className="text-lg font-semibold mb-4">Filtros</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportType === 'attendance' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Fecha Inicio *</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Fecha Fin *</label>
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
                      value={filters.employeeId || ''}
                      onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
                      placeholder="Filtrar por empleado específico"
                      className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Departamento (opcional)</label>
                    <input
                      type="text"
                      value={filters.department || ''}
                      onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                      placeholder="Filtrar por departamento"
                      className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800"
                    />
                  </div>
                </>
              )}

              {reportType === 'employees' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Estado</label>
                  <select
                    value={filters.status || 'active'}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800"
                  >
                    <option value="active">Activos</option>
                    <option value="inactive">Inactivos</option>
                    <option value="all">Todos</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Field Selection */}
        <div className="space-y-6">
          {/* Selected Fields */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h3 className="text-lg font-semibold mb-4">
              Campos Seleccionados ({selectedFields.length})
            </h3>
            {selectedFields.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-8">
                Selecciona campos desde la lista de abajo
              </p>
            ) : (
              <div className="space-y-2">
                {selectedFields.map((field) => {
                  const fieldInfo = availableFields.find((f) => f.value === field);
                  return (
                    <div
                      key={field}
                      className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg"
                    >
                      <span className="text-sm font-medium">{fieldInfo?.label || field}</span>
                      <button
                        onClick={() => handleRemoveField(field)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Available Fields */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h3 className="text-lg font-semibold mb-4">Campos Disponibles</h3>
            {unselectedFields.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-8">
                Todos los campos están seleccionados
              </p>
            ) : (
              <div className="space-y-2">
                {unselectedFields.map((field) => (
                  <button
                    key={field.value}
                    onClick={() => handleAddField(field.value)}
                    className="w-full flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition"
                  >
                    <span className="text-sm">{field.label}</span>
                    <Plus className="w-4 h-4 text-blue-600" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
