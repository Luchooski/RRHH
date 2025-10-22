import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { http } from '../../lib/http';

type EmployeeProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  baseSalary: number;
  monthlyHours: number;
  phone?: string;
};

export function EmployeeProfile() {
  const { data: profile, isLoading, error } = useQuery<EmployeeProfile>({
    queryKey: ['employee-profile'],
    queryFn: () => http.get('/api/v1/employee-portal/profile', { auth: true }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <Card className="p-6">
        <p className="text-red-600 dark:text-red-400">
          Error al cargar el perfil
        </p>
      </Card>
    );
  }

  const fields = [
    { label: 'Nombre', value: profile.name },
    { label: 'Email', value: profile.email },
    { label: 'Puesto', value: profile.role },
    { label: 'Teléfono', value: profile.phone || 'No especificado' },
    { label: 'Salario Base', value: `$${profile.baseSalary.toLocaleString()}` },
    { label: 'Horas Mensuales', value: profile.monthlyHours },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Mi Perfil
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Información personal y laboral
        </p>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map((field) => (
            <div key={field.label}>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {field.label}
              </label>
              <p className="mt-1 text-lg text-gray-900 dark:text-white">
                {field.value}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
