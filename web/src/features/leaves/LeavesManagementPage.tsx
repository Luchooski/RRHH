import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useLeaves, useApproveLeave, useDeleteLeave } from './hooks';
import { useToast } from '@/components/ui/Toast';
import { LEAVE_TYPE_LABELS, LEAVE_STATUS_LABELS, type LeaveStatus, type LeaveType } from './dto';
import { Calendar, Check, X, Trash2, Filter } from 'lucide-react';
import { Toolbar } from '@/components/ui/Toolbar';

export default function LeavesManagementPage() {
  const { push } = useToast();
  const [filters, setFilters] = useState<{
    employeeId?: string;
    type?: LeaveType | '';
    status?: LeaveStatus | '';
    year?: number;
  }>({
    employeeId: '',
    type: '',
    status: 'pending',
    year: new Date().getFullYear(),
  });

  const { data, isLoading, refetch } = useLeaves(filters as any);
  const deleteLeave = useDeleteLeave();

  const onApprove = async (id: string) => {
    try {
      const approve = useApproveLeave(id);
      await approve.mutateAsync({ approved: true });
      push({ kind: 'success', title: 'Licencia aprobada', message: 'La solicitud fue aprobada correctamente' });
      refetch();
    } catch (error: any) {
      push({ kind: 'error', title: 'Error', message: error?.message ?? 'No se pudo aprobar la solicitud' });
    }
  };

  const onReject = async (id: string) => {
    const reason = prompt('¿Por qué rechazas esta solicitud?');
    if (!reason) return;

    try {
      const approve = useApproveLeave(id);
      await approve.mutateAsync({ approved: false, rejectedReason: reason });
      push({ kind: 'success', title: 'Licencia rechazada', message: 'La solicitud fue rechazada' });
      refetch();
    } catch (error: any) {
      push({ kind: 'error', title: 'Error', message: error?.message ?? 'No se pudo rechazar la solicitud' });
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta solicitud de licencia?')) return;
    try {
      await deleteLeave.mutateAsync(id);
      push({ kind: 'success', title: 'Eliminado', message: 'La solicitud fue eliminada' });
    } catch (error: any) {
      push({ kind: 'error', title: 'Error', message: error?.message ?? 'No se pudo eliminar' });
    }
  };

  const items = data?.items ?? [];

  return (
    <div className="container space-y-4">
      <Toolbar
        title="Gestión de Licencias"
        right={
          <Button onClick={() => refetch()}>
            {isLoading ? 'Actualizando...' : 'Refrescar'}
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter size={18} />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <Select
                value={filters.type || ''}
                onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value as any }))}
              >
                <option value="">Todos</option>
                {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <Select
                value={filters.status || ''}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as any }))}
              >
                <option value="">Todos</option>
                {Object.entries(LEAVE_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Año</label>
              <Input
                type="number"
                value={filters.year || ''}
                onChange={(e) => setFilters((f) => ({ ...f, year: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Employee ID (opcional)</label>
              <Input
                value={filters.employeeId || ''}
                onChange={(e) => setFilters((f) => ({ ...f, employeeId: e.target.value }))}
                placeholder="Filtrar por empleado"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Leaves Table */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitudes de Licencia ({items.length})</CardTitle>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <p className="text-center text-gray-500 py-8">Cargando...</p>
          ) : items.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay solicitudes con los filtros seleccionados</p>
          ) : (
            <div className="space-y-3">
              {items.map((leave) => (
                <div
                  key={leave.id}
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold">{leave.employeeName}</span>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          leave.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          leave.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          leave.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {LEAVE_STATUS_LABELS[leave.status]}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Tipo:</span>{' '}
                          <span className="font-medium">{LEAVE_TYPE_LABELS[leave.type]}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Días:</span>{' '}
                          <span className="font-medium">{leave.days} {leave.halfDay ? '(medio día)' : ''}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Desde:</span>{' '}
                          <span className="font-medium">{new Date(leave.startDate).toLocaleDateString('es-AR')}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Hasta:</span>{' '}
                          <span className="font-medium">{new Date(leave.endDate).toLocaleDateString('es-AR')}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Motivo:</span>{' '}
                        <span>{leave.reason}</span>
                      </div>
                      {leave.description && (
                        <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {leave.description}
                        </div>
                      )}
                      {leave.rejectedReason && (
                        <div className="mt-2 p-2 rounded bg-red-50 dark:bg-red-950 text-sm text-red-800 dark:text-red-200">
                          <span className="font-medium">Razón de rechazo:</span> {leave.rejectedReason}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {leave.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => onApprove(leave.id)}
                            title="Aprobar"
                          >
                            <Check size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => onReject(leave.id)}
                            title="Rechazar"
                          >
                            <X size={16} />
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(leave.id)}
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
