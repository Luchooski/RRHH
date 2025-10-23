import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { useLeaveBalance } from './hooks';
import { Calendar, Clock } from 'lucide-react';

type Props = {
  employeeId: string;
  year?: number;
};

export default function LeaveBalanceWidget({ employeeId, year }: Props) {
  const { data: balance, isLoading } = useLeaveBalance(employeeId, year);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balance de Licencias</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-gray-500">Cargando...</p>
        </CardBody>
      </Card>
    );
  }

  if (!balance) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balance de Licencias</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-gray-500">No se pudo cargar el balance</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar size={20} />
          Balance de Licencias {year || new Date().getFullYear()}
        </CardTitle>
      </CardHeader>
      <CardBody className="space-y-4">
        {/* Vacaciones */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Vacaciones</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {balance.vacation.available} de {balance.vacation.total} días
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all"
              style={{ width: `${(balance.vacation.used / balance.vacation.total) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-600 dark:text-gray-400">
            <span>Usados: {balance.vacation.used}</span>
            <span>Pendientes: {balance.vacation.pending}</span>
          </div>
        </div>

        {/* Enfermedad */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Enfermedad</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {balance.sick.available} de {balance.sick.total} días
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-red-500 h-2.5 rounded-full transition-all"
              style={{ width: `${(balance.sick.used / balance.sick.total) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-600 dark:text-gray-400">
            <span>Usados: {balance.sick.used}</span>
            <span>Pendientes: {balance.sick.pending}</span>
          </div>
        </div>

        {/* Otras licencias */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Otras licencias</span>
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-600 dark:text-gray-400">
            <span>Usados: {balance.other.used} días</span>
            <span>Pendientes: {balance.other.pending} días</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
