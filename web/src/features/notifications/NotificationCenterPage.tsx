import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Toolbar } from '@/components/ui/Toolbar';
import { useToast } from '@/components/ui/Toast';
import { Bell, Check, Trash2, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import * as api from './api';
import type { Notification, Workflow } from './dto';
import { useNavigate } from '@tanstack/react-router';

export default function NotificationCenterPage() {
  const { push } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'notifications' | 'workflows'>('notifications');
  const [filterRead, setFilterRead] = useState<boolean | undefined>(false);

  const { data: notificationsData, isLoading: loadingNotifications } = useQuery({
    queryKey: ['notifications', { isRead: filterRead, limit: 50 }],
    queryFn: () => api.getNotifications({ isRead: filterRead, limit: 50 }),
  });

  const { data: workflowsData, isLoading: loadingWorkflows } = useQuery({
    queryKey: ['pending-workflows'],
    queryFn: () => api.getPendingWorkflows({ limit: 50 }),
  });

  const { data: stats } = useQuery({
    queryKey: ['notification-stats'],
    queryFn: () => api.getNotificationStats(),
  });

  const { data: workflowStats } = useQuery({
    queryKey: ['workflow-stats'],
    queryFn: () => api.getWorkflowStats(),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => api.markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
      push({ kind: 'success', title: 'Marcada como leída', message: '' });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => api.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
      push({ kind: 'success', title: 'Todas marcadas como leídas', message: '' });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id: string) => api.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
      push({ kind: 'success', title: 'Notificación eliminada', message: '' });
    },
  });

  const completeStepMutation = useMutation({
    mutationFn: ({ workflowId, stepId, comments }: { workflowId: string; stepId: string; comments?: string }) =>
      api.completeWorkflowStep(workflowId, stepId, { comments }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-workflows'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-stats'] });
      push({ kind: 'success', title: 'Tarea completada', message: '' });
    },
  });

  const rejectStepMutation = useMutation({
    mutationFn: ({ workflowId, stepId, reason }: { workflowId: string; stepId: string; reason: string }) =>
      api.rejectWorkflowStep(workflowId, stepId, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-workflows'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-stats'] });
      push({ kind: 'success', title: 'Tarea rechazada', message: '' });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification._id);
    }

    if (notification.actionUrl) {
      navigate({ to: notification.actionUrl });
    }
  };

  const handleCompleteStep = (workflow: Workflow) => {
    const currentStep = workflow.steps[workflow.currentStepIndex];
    const comments = prompt('Comentarios (opcional):');
    if (comments === null) return;

    completeStepMutation.mutate({
      workflowId: workflow._id,
      stepId: currentStep.stepId,
      comments: comments || undefined,
    });
  };

  const handleRejectStep = (workflow: Workflow) => {
    const currentStep = workflow.steps[workflow.currentStepIndex];
    const reason = prompt('¿Por qué rechazas esta tarea?');
    if (!reason) return;

    rejectStepMutation.mutate({
      workflowId: workflow._id,
      stepId: currentStep.stepId,
      reason,
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="text-green-600" size={20} />;
      case 'warning':
        return <AlertCircle className="text-yellow-600" size={20} />;
      case 'error':
        return <XCircle className="text-red-600" size={20} />;
      default:
        return <Bell className="text-blue-600" size={20} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const notifications = notificationsData?.notifications || [];
  const workflows = workflowsData?.workflows || [];

  return (
    <div className="container space-y-4">
      <Toolbar
        title="Centro de Notificaciones"
        subtitle={stats ? `${stats.unread} sin leer de ${stats.total} total` : undefined}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Sin Leer</div>
                <div className="text-2xl font-bold">{stats?.unread || 0}</div>
              </div>
              <Bell className="text-blue-600" size={32} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Total</div>
                <div className="text-2xl font-bold">{stats?.total || 0}</div>
              </div>
              <Check className="text-gray-600" size={32} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Tareas Pendientes</div>
                <div className="text-2xl font-bold">{workflowStats?.pendingTasks || 0}</div>
              </div>
              <Clock className="text-orange-600" size={32} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Workflows</div>
                <div className="text-2xl font-bold">{workflowStats?.inProgress || 0}</div>
              </div>
              <AlertCircle className="text-purple-600" size={32} />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('notifications')}
          className={'px-4 py-2 border-b-2 transition-colors ' + (activeTab === 'notifications' ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-gray-600 hover:text-gray-900')}
        >
          Notificaciones ({stats?.total || 0})
        </button>
        <button
          onClick={() => setActiveTab('workflows')}
          className={'px-4 py-2 border-b-2 transition-colors ' + (activeTab === 'workflows' ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-gray-600 hover:text-gray-900')}
        >
          Tareas Pendientes ({workflowStats?.pendingTasks || 0})
        </button>
      </div>

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setFilterRead(false)}
                className={'px-3 py-1 rounded text-sm ' + (filterRead === false ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700')}
              >
                No leídas
              </button>
              <button
                onClick={() => setFilterRead(undefined)}
                className={'px-3 py-1 rounded text-sm ' + (filterRead === undefined ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700')}
              >
                Todas
              </button>
            </div>
            {stats && stats.unread > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
              >
                <Check size={16} className="mr-2" />
                Marcar todas leídas
              </Button>
            )}
          </div>

          {loadingNotifications ? (
            <Card>
              <CardBody>
                <div className="text-center py-8 text-gray-500">Cargando...</div>
              </CardBody>
            </Card>
          ) : notifications.length === 0 ? (
            <Card>
              <CardBody>
                <div className="text-center py-8 text-gray-500">
                  <Bell size={48} className="mx-auto mb-2 text-gray-300" />
                  <p>No hay notificaciones</p>
                </div>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <Card
                  key={notification._id}
                  className={'cursor-pointer hover:shadow-md transition-shadow ' + (!notification.isRead ? getNotificationColor(notification.type) : '')}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardBody>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                          <div className="flex items-center gap-2">
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-blue-600 rounded-full" />
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('¿Eliminar esta notificación?')) {
                                  deleteNotificationMutation.mutate(notification._id);
                                }
                              }}
                              className="text-gray-400 hover:text-red-600"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>{new Date(notification.createdAt).toLocaleString('es')}</span>
                          <span className="px-2 py-0.5 bg-gray-200 rounded">{notification.category}</span>
                          {notification.priority === 'high' || notification.priority === 'urgent' ? (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded">
                              {notification.priority === 'urgent' ? 'Urgente' : 'Alta'}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Workflows Tab */}
      {activeTab === 'workflows' && (
        <div className="space-y-4">
          {loadingWorkflows ? (
            <Card>
              <CardBody>
                <div className="text-center py-8 text-gray-500">Cargando...</div>
              </CardBody>
            </Card>
          ) : workflows.length === 0 ? (
            <Card>
              <CardBody>
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle2 size={48} className="mx-auto mb-2 text-gray-300" />
                  <p>No tienes tareas pendientes</p>
                </div>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-3">
              {workflows.map((workflow) => {
                const currentStep = workflow.steps[workflow.currentStepIndex];
                return (
                  <Card key={workflow._id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{workflow.name}</CardTitle>
                          {workflow.description && (
                            <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
                          )}
                        </div>
                        <span className={'px-2 py-1 rounded text-xs font-semibold ' + (workflow.priority === 'urgent' ? 'bg-red-100 text-red-700' : workflow.priority === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700')}>
                          {workflow.priority}
                        </span>
                      </div>
                    </CardHeader>
                    <CardBody className="space-y-3">
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <div className="font-medium text-blue-900">Tarea Actual: {currentStep.name}</div>
                        {currentStep.dueDate && (
                          <div className="text-sm text-blue-700 mt-1">
                            Vence: {new Date(currentStep.dueDate).toLocaleDateString('es')}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {workflow.steps.map((step, idx) => (
                          <div key={step.stepId} className="flex items-center">
                            <div className={'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ' + (step.status === 'completed' ? 'bg-green-500 text-white' : idx === workflow.currentStepIndex ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600')}>
                              {idx + 1}
                            </div>
                            {idx < workflow.steps.length - 1 && (
                              <div className={'w-8 h-1 ' + (step.status === 'completed' ? 'bg-green-500' : 'bg-gray-300')} />
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleCompleteStep(workflow)}
                          disabled={completeStepMutation.isPending}
                          size="sm"
                        >
                          <CheckCircle2 size={16} className="mr-2" />
                          Completar
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleRejectStep(workflow)}
                          disabled={rejectStepMutation.isPending}
                          size="sm"
                        >
                          <XCircle size={16} className="mr-2" />
                          Rechazar
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
