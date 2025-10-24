import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Toolbar } from '@/components/ui/Toolbar';
import { useToast } from '@/components/ui/Toast';
import {
  Calendar,
  Users,
  TrendingUp,
  PlayCircle,
  Eye,
  Edit,
  Plus,
  BarChart3,
} from 'lucide-react';
import * as api from './api';
import type { EvaluationCycle } from './dto';
import { useNavigate } from '@tanstack/react-router';

export default function EvaluationsPage() {
  const { push } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>('active');

  const { data: cycles, isLoading } = useQuery({
    queryKey: ['evaluation-cycles', selectedStatus],
    queryFn: () => api.listCycles({ status: selectedStatus || undefined }),
  });

  const launchMutation = useMutation({
    mutationFn: (cycleId: string) => api.launchCycle(cycleId, { includeSelfEvaluation: true }),
    onSuccess: () => {
      push({ kind: 'success', title: 'Éxito', message: 'Ciclo lanzado correctamente' });
      queryClient.invalidateQueries({ queryKey: ['evaluation-cycles'] });
    },
    onError: (error: any) => {
      push({ kind: 'error', title: 'Error', message: error?.message ?? 'No se pudo lanzar el ciclo' });
    },
  });

  const handleLaunchCycle = async (cycleId: string) => {
    if (!confirm('¿Desea lanzar este ciclo y asignar las evaluaciones a los empleados?')) return;
    await launchMutation.mutateAsync(cycleId);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const labels = {
      draft: 'Borrador',
      active: 'Activo',
      'in-progress': 'En Progreso',
      completed: 'Completado',
      cancelled: 'Cancelado',
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  return (
    <div className="container space-y-4">
      <Toolbar
        title="Evaluaciones de Desempeño"
        right={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate({ to: '/evaluations/templates' })}
            >
              <Edit size={16} className="mr-2" />
              Plantillas
            </Button>
            <Button onClick={() => navigate({ to: '/evaluations/cycles/new' })}>
              <Plus size={16} className="mr-2" />
              Nuevo Ciclo
            </Button>
          </div>
        }
      />

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { value: '', label: 'Todos' },
          { value: 'draft', label: 'Borradores' },
          { value: 'active', label: 'Activos' },
          { value: 'in-progress', label: 'En Progreso' },
          { value: 'completed', label: 'Completados' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedStatus(tab.value)}
            className={`px-4 py-2 border-b-2 transition-colors ${
              selectedStatus === tab.value
                ? 'border-blue-600 text-blue-600 font-medium'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cycles List */}
      {isLoading ? (
        <Card>
          <CardBody>
            <div className="text-center py-8 text-gray-500">Cargando ciclos...</div>
          </CardBody>
        </Card>
      ) : !cycles || cycles.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-8 text-gray-500">
              No hay ciclos de evaluación.
              <br />
              <Button onClick={() => navigate({ to: '/evaluations/cycles/new' })} className="mt-4">
                Crear Primer Ciclo
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4">
          {cycles.map((cycle) => (
            <Card key={cycle._id}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <CardTitle>{cycle.name}</CardTitle>
                    {getStatusBadge(cycle.status)}
                  </div>
                  {cycle.description && (
                    <p className="text-sm text-gray-600 mt-1">{cycle.description}</p>
                  )}
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-500">Inicio</div>
                      <div className="font-medium">
                        {new Date(cycle.startDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-500">Fin</div>
                      <div className="font-medium">
                        {new Date(cycle.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-500">Asignadas</div>
                      <div className="font-medium">{cycle.stats.totalAssigned}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-500">Completadas</div>
                      <div className="font-medium">
                        {cycle.stats.totalCompleted} ({cycle.stats.completionRate}%)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {cycle.stats.totalAssigned > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progreso</span>
                      <span>
                        {cycle.stats.totalCompleted} / {cycle.stats.totalAssigned}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${cycle.stats.completionRate}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate({ to: `/evaluations/cycles/${cycle._id}` })}
                  >
                    <Eye size={14} className="mr-2" />
                    Ver Detalles
                  </Button>

                  {cycle.status === 'draft' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleLaunchCycle(cycle._id)}
                      disabled={launchMutation.isPending}
                    >
                      <PlayCircle size={14} className="mr-2" />
                      Lanzar Ciclo
                    </Button>
                  )}

                  {(cycle.status === 'in-progress' || cycle.status === 'completed') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate({ to: `/evaluations/analytics/${cycle._id}` })}
                    >
                      <BarChart3 size={14} className="mr-2" />
                      Analytics
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
