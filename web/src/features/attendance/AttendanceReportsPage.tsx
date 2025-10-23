import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useAttendances, useAttendanceSummary, useMarkAbsence, useUpdateAttendance, useDeleteAttendance } from './hooks';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '../auth/auth';
import { Calendar, Download, Filter, Trash2, Edit2, UserX, BarChart3 } from 'lucide-react';
import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_COLORS } from './dto';
import type { AttendanceStatus } from './dto';

export default function AttendanceReportsPage() {
  const { user } = useAuth();
  const { push } = useToast();

  // Filters
  const [employeeId, setEmployeeId] = useState('');
  const [status, setStatus] = useState<AttendanceStatus | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showSummary, setShowSummary] = useState(false);

  // Fetch attendances with filters
  const { data: attendances, refetch } = useAttendances({
    employeeId: employeeId || undefined,
    status: status || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    limit: 100,
  });

  // Fetch summary if dates and employee selected
  const { data: summary } = useAttendanceSummary({
    employeeId: employeeId || user?.id || '',
    startDate: startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: endDate || new Date().toISOString().split('T')[0],
  });

  const markAbsence = useMarkAbsence();
  const deleteAttendance = useDeleteAttendance();

  const items = attendances?.items ?? [];

  const handleMarkAbsence = async () => {
    if (!employeeId || !startDate) {
      push({ kind: 'error', title: 'Error', message: 'Selecciona empleado y fecha' });
      return;
    }

    try {
      await markAbsence.mutateAsync({
        employeeId,
        date: startDate,
        reason: 'Marcado manualmente por administrador',
      });
      push({ kind: 'success', title: 'Ausencia registrada', message: 'La ausencia fue marcada correctamente' });
      refetch();
    } catch (error: any) {
      push({ kind: 'error', title: 'Error', message: error?.message ?? 'No se pudo marcar la ausencia' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este registro de asistencia?')) {
      return;
    }

    try {
      await deleteAttendance.mutateAsync(id);
      push({ kind: 'success', title: 'Eliminado', message: 'El registro fue eliminado correctamente' });
      refetch();
    } catch (error: any) {
      push({ kind: 'error', title: 'Error', message: error?.message ?? 'No se pudo eliminar el registro' });
    }
  };

  const handleExport = () => {
    if (items.length === 0) {
      push({ kind: 'error', title: 'Sin datos', message: 'No hay registros para exportar' });
      return;
    }

    // Create CSV
    const headers = ['Fecha', 'Empleado', 'Entrada', 'Salida', 'Horas Trabajadas', 'Horas Extra', 'Descanso (min)', 'Llegada Tarde (min)', 'Estado', 'Notas'];
    const rows = items.map(item => [
      new Date(item.date).toLocaleDateString('es-AR'),
      item.employeeName,
      item.checkIn ? new Date(item.checkIn).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '',
      item.checkOut ? new Date(item.checkOut).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '',
      item.hoursWorked?.toFixed(2) || '0',
      item.overtimeHours?.toFixed(2) || '0',
      item.breakMinutes || '0',
      item.lateMinutes || '0',
      ATTENDANCE_STATUS_LABELS[item.status],
      item.notes || '',
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `asistencias_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    push({ kind: 'success', title: 'Exportado', message: 'Los registros fueron exportados correctamente' });
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '--:--';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatHours = (hours?: number) => {
    if (!hours) return '0.00';
    return hours.toFixed(2);
  };

  return (
    <div className="container space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Reportes de Asistencia</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Visualiza y gestiona los registros de asistencia</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowSummary(!showSummary)} variant="ghost">
            <BarChart3 size={18} />
            {showSummary ? 'Ocultar resumen' : 'Ver resumen'}
          </Button>
          <Button onClick={handleExport} variant="ghost" disabled={items.length === 0}>
            <Download size={18} />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Filter size={18} />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Input
              label="ID Empleado"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="ID o nombre"
            />

            <Select
              label="Estado"
              value={status}
              onChange={(e) => setStatus(e.target.value as AttendanceStatus | '')}
            >
              <option value="">Todos</option>
              <option value="present">Presente</option>
              <option value="absent">Ausente</option>
              <option value="late">Tarde</option>
              <option value="half_day">Medio día</option>
              <option value="leave">Licencia</option>
              <option value="holiday">Feriado</option>
            </Select>

            <Input
              label="Fecha Inicio"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            <Input
              label="Fecha Fin"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />

            <div className="flex items-end gap-2">
              <Button onClick={() => refetch()} variant="primary" className="flex-1">
                Buscar
              </Button>
              <Button
                onClick={() => {
                  setEmployeeId('');
                  setStatus('');
                  setStartDate('');
                  setEndDate('');
                }}
                variant="ghost"
              >
                Limpiar
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-4 flex gap-2">
            <Button onClick={handleMarkAbsence} variant="ghost" size="sm" disabled={!employeeId || !startDate}>
              <UserX size={16} />
              Marcar ausencia
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Summary Card */}
      {showSummary && summary && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
          <CardHeader>
            <CardTitle>
              <BarChart3 size={18} />
              Resumen del Período
            </CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Días</div>
                <div className="text-2xl font-bold">{summary.totalDays}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Presente</div>
                <div className="text-2xl font-bold text-green-600">{summary.present}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Ausente</div>
                <div className="text-2xl font-bold text-red-600">{summary.absent}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tarde</div>
                <div className="text-2xl font-bold text-yellow-600">{summary.late}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Horas</div>
                <div className="text-2xl font-bold">{formatHours(summary.totalHours)}h</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Promedio/Día</div>
                <div className="text-2xl font-bold">{formatHours(summary.averageHoursPerDay)}h</div>
              </div>
            </div>

            {summary.overtimeHours > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm">
                <strong>Horas extra:</strong> {formatHours(summary.overtimeHours)} horas
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Calendar size={18} />
            Registros de Asistencia ({items.length})
          </CardTitle>
        </CardHeader>
        <CardBody>
          {items.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No hay registros para los filtros seleccionados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 dark:border-gray-700">
                  <tr className="text-left">
                    <th className="pb-3 font-medium">Fecha</th>
                    <th className="pb-3 font-medium">Empleado</th>
                    <th className="pb-3 font-medium">Entrada</th>
                    <th className="pb-3 font-medium">Salida</th>
                    <th className="pb-3 font-medium">Horas</th>
                    <th className="pb-3 font-medium">Extra</th>
                    <th className="pb-3 font-medium">Descanso</th>
                    <th className="pb-3 font-medium">Estado</th>
                    <th className="pb-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3">{new Date(item.date).toLocaleDateString('es-AR')}</td>
                      <td className="py-3 font-medium">{item.employeeName}</td>
                      <td className="py-3">{formatTime(item.checkIn)}</td>
                      <td className="py-3">{formatTime(item.checkOut)}</td>
                      <td className="py-3">{formatHours(item.hoursWorked)}h</td>
                      <td className="py-3">
                        {item.overtimeHours ? (
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            +{formatHours(item.overtimeHours)}h
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3">{item.breakMinutes || 0} min</td>
                      <td className="py-3">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${ATTENDANCE_STATUS_COLORS[item.status]}`}>
                          {ATTENDANCE_STATUS_LABELS[item.status]}
                        </span>
                        {item.lateMinutes && item.lateMinutes > 0 && (
                          <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">
                            +{item.lateMinutes}' tarde
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
