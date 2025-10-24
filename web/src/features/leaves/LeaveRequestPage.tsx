import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useCreateLeave, useLeaves } from './hooks';
import { useToast } from '@/components/ui/Toast';
import { LEAVE_TYPE_LABELS, LEAVE_STATUS_LABELS, type LeaveType, type LeaveCreateInput } from './dto';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import LeaveBalanceWidget from './LeaveBalanceWidget';
import { useAuth } from '../auth/auth';

export default function LeaveRequestPage() {
  const navigate = useNavigate();
  const { push } = useToast();
  const { user } = useAuth();
  const create = useCreateLeave();
  const { data: leavesData } = useLeaves({ employeeId: user?.id, limit: 10 });

  const [form, setForm] = useState<LeaveCreateInput>({
    type: 'vacation',
    startDate: '',
    endDate: '',
    halfDay: false,
    reason: '',
    description: '',
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate || !form.reason) {
      push({ kind: 'error', title: 'Error', message: 'Completa todos los campos obligatorios' });
      return;
    }

    try {
      await create.mutateAsync(form);
      push({ kind: 'success', title: 'Solicitud creada', message: 'Tu solicitud de licencia fue enviada correctamente' });
      setForm({ type: 'vacation', startDate: '', endDate: '', halfDay: false, reason: '', description: '' });
    } catch (error: any) {
      push({ kind: 'error', title: 'Error', message: error?.message ?? 'No se pudo crear la solicitud' });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle size={16} className="text-green-600" />;
      case 'rejected': return <XCircle size={16} className="text-red-600" />;
      case 'pending': return <Clock size={16} className="text-yellow-600" />;
      case 'cancelled': return <AlertCircle size={16} className="text-gray-600" />;
      default: return null;
    }
  };

  const items = leavesData?.items ?? [];

  return (
    <div className="container space-y-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Mis Licencias</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Solicita y gestiona tus licencias</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar size={20} />
              Nueva Solicitud
            </CardTitle>
          </CardHeader>
          <CardBody>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tipo de licencia <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as LeaveType }))}
                    required
                  >
                    {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Medio día</label>
                  <input
                    type="checkbox"
                    checked={form.halfDay}
                    onChange={(e) => setForm((f) => ({ ...f, halfDay: e.target.checked }))}
                    className="mt-2 h-5 w-5 rounded border-gray-300"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Fecha inicio <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Fecha fin <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Motivo <span className="text-red-500">*</span>
                </label>
                <Input
                  value={form.reason}
                  onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                  placeholder="ej: Vacaciones familiares"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Descripción (opcional)</label>
                <textarea
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 min-h-[80px]"
                  value={form.description || ''}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Detalles adicionales..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setForm({ type: 'vacation', startDate: '', endDate: '', halfDay: false, reason: '', description: '' })}>
                  Limpiar
                </Button>
                <Button type="submit" variant="primary" disabled={create.isPending}>
                  {create.isPending ? 'Enviando...' : 'Solicitar licencia'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* Balance Widget */}
        {user?.id && <LeaveBalanceWidget employeeId={user.id} />}
      </div>

      {/* My Leaves List */}
      <Card>
        <CardHeader>
          <CardTitle>Mis Solicitudes Recientes</CardTitle>
        </CardHeader>
        <CardBody>
          {items.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No tienes solicitudes de licencia aún</p>
          ) : (
            <div className="space-y-2">
              {items.map((leave) => (
                <div
                  key={leave.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(leave.status)}
                      <span className="font-medium">{LEAVE_TYPE_LABELS[leave.type]}</span>
                      <span className="text-sm text-gray-500">({leave.days} {leave.halfDay ? 'medio día' : leave.days === 1 ? 'día' : 'días'})</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {new Date(leave.startDate).toLocaleDateString('es-AR')} - {new Date(leave.endDate).toLocaleDateString('es-AR')}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{leave.reason}</div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      leave.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      leave.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      leave.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {LEAVE_STATUS_LABELS[leave.status]}
                    </span>
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
