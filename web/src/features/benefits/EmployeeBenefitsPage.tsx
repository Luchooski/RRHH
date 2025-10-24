import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { useEmployeeBenefits, useBenefitsCostSummary } from './hooks';
import { useAuth } from '../auth/auth';
import {
  BENEFIT_TYPE_LABELS,
  BENEFIT_TYPE_ICONS,
  BENEFIT_FREQUENCY_LABELS,
  EMPLOYEE_BENEFIT_STATUS_LABELS,
  EMPLOYEE_BENEFIT_STATUS_COLORS,
} from './dto';
import { DollarSign, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function EmployeeBenefitsPage() {
  const { user } = useAuth();

  const { data: benefits } = useEmployeeBenefits({
    employeeId: user?.id,
  });

  const { data: costSummary } = useBenefitsCostSummary({
    employeeId: user?.id,
  });

  const activeBenefits = benefits?.filter((b) => b.status === 'active') || [];
  const pendingBenefits = benefits?.filter((b) => b.status === 'pending') || [];
  const items = benefits || [];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-AR');
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} $${amount.toFixed(2)}`;
  };

  return (
    <div className="container space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold">Mis Beneficios</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Visualiza tus beneficios activos y pendientes
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Beneficios Activos</p>
                <p className="text-3xl font-bold">{activeBenefits.length}</p>
              </div>
              <CheckCircle size={40} className="text-blue-600 dark:text-blue-400" />
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pendientes Aprobación</p>
                <p className="text-3xl font-bold">{pendingBenefits.length}</p>
              </div>
              <Clock size={40} className="text-yellow-600 dark:text-yellow-400" />
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Costo Mensual para Mí</p>
                <p className="text-2xl font-bold">
                  {costSummary ? formatCurrency(costSummary.totalCostToEmployee, costSummary.currency) : '$0'}
                </p>
              </div>
              <DollarSign size={40} className="text-green-600 dark:text-green-400" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Pending Benefits */}
      {pendingBenefits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              <Clock size={18} />
              Beneficios Pendientes de Aprobación
            </CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {pendingBenefits.map((benefit) => (
                <div
                  key={benefit._id}
                  className="flex items-center justify-between p-4 border border-yellow-200 dark:border-yellow-800 rounded-lg bg-yellow-50 dark:bg-yellow-950"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{BENEFIT_TYPE_ICONS[benefit.benefitType]}</span>
                    <div>
                      <h3 className="font-semibold">{benefit.benefitName}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {BENEFIT_TYPE_LABELS[benefit.benefitType]}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${EMPLOYEE_BENEFIT_STATUS_COLORS[benefit.status]}`}>
                      {EMPLOYEE_BENEFIT_STATUS_LABELS[benefit.status]}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      Solicitado: {formatDate(benefit.requestedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Active Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>
            <CheckCircle size={18} />
            Mis Beneficios Activos
          </CardTitle>
        </CardHeader>
        <CardBody>
          {activeBenefits.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No tienes beneficios activos en este momento.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeBenefits.map((benefit) => (
                <div
                  key={benefit._id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{BENEFIT_TYPE_ICONS[benefit.benefitType]}</span>
                      <div>
                        <h3 className="font-semibold">{benefit.benefitName}</h3>
                        <p className="text-xs text-gray-500">{BENEFIT_TYPE_LABELS[benefit.benefitType]}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${EMPLOYEE_BENEFIT_STATUS_COLORS[benefit.status]}`}>
                      {EMPLOYEE_BENEFIT_STATUS_LABELS[benefit.status]}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        <Calendar size={14} className="inline mr-1" />
                        Desde:
                      </span>
                      <span className="font-medium">{formatDate(benefit.startDate)}</span>
                    </div>

                    {benefit.endDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          <Calendar size={14} className="inline mr-1" />
                          Hasta:
                        </span>
                        <span className="font-medium">{formatDate(benefit.endDate)}</span>
                      </div>
                    )}

                    {benefit.costToEmployee > 0 && (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">
                          <DollarSign size={14} className="inline mr-1" />
                          Mi costo:
                        </span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {formatCurrency(benefit.costToEmployee, benefit.currency)} /{' '}
                          {BENEFIT_FREQUENCY_LABELS[benefit.frequency]}
                        </span>
                      </div>
                    )}

                    {benefit.costToEmployee === 0 && (
                      <div className="flex items-center justify-center pt-2 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-green-600 dark:text-green-400 font-medium text-sm">
                          ✓ Sin costo para mí
                        </span>
                      </div>
                    )}
                  </div>

                  {benefit.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        <strong>Notas:</strong> {benefit.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* All Benefits History */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial Completo</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 dark:border-gray-700">
                  <tr className="text-left">
                    <th className="pb-3 font-medium">Beneficio</th>
                    <th className="pb-3 font-medium">Tipo</th>
                    <th className="pb-3 font-medium">Desde</th>
                    <th className="pb-3 font-medium">Hasta</th>
                    <th className="pb-3 font-medium">Estado</th>
                    <th className="pb-3 font-medium">Costo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {items.map((benefit) => (
                    <tr key={benefit._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 font-medium">{benefit.benefitName}</td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1">
                          {BENEFIT_TYPE_ICONS[benefit.benefitType]}
                          <span className="text-xs">{BENEFIT_TYPE_LABELS[benefit.benefitType]}</span>
                        </span>
                      </td>
                      <td className="py-3">{formatDate(benefit.startDate)}</td>
                      <td className="py-3">{benefit.endDate ? formatDate(benefit.endDate) : 'Indefinido'}</td>
                      <td className="py-3">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${EMPLOYEE_BENEFIT_STATUS_COLORS[benefit.status]}`}>
                          {EMPLOYEE_BENEFIT_STATUS_LABELS[benefit.status]}
                        </span>
                      </td>
                      <td className="py-3">
                        {benefit.costToEmployee > 0
                          ? formatCurrency(benefit.costToEmployee, benefit.currency)
                          : 'Gratis'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
