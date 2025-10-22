import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { http } from '../lib/http';
import { useToast } from '../components/ui/Toast';

type FormData = {
  companyName: string;
  companyEmail: string;
  adminName: string;
  adminEmail: string;
  password: string;
  confirmPassword: string;
};

export function TenantRegister() {
  const navigate = useNavigate();
  const { push } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    companyEmail: '',
    adminName: '',
    adminEmail: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'El nombre de la empresa es requerido';
    }

    if (!formData.companyEmail.trim()) {
      newErrors.companyEmail = 'El email de la empresa es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.companyEmail)) {
      newErrors.companyEmail = 'Email inválido';
    }

    if (!formData.adminName.trim()) {
      newErrors.adminName = 'El nombre del administrador es requerido';
    }

    if (!formData.adminEmail.trim()) {
      newErrors.adminEmail = 'El email del administrador es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
      newErrors.adminEmail = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      await http.post('/api/v1/tenants/register', {
        name: formData.companyName,
        email: formData.companyEmail,
        adminUser: {
          name: formData.adminName,
          email: formData.adminEmail,
          password: formData.password,
        },
      });

      push({
        kind: 'success',
        message: 'Empresa registrada exitosamente. Por favor inicia sesión.',
      });

      navigate('/login');
    } catch (error: any) {
      push({
        kind: 'error',
        message: error.message || 'Error al registrar la empresa',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Registrar Empresa
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Crea tu cuenta empresarial para comenzar a gestionar tu equipo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b dark:border-gray-700 pb-2">
              Información de la Empresa
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre de la Empresa *
              </label>
              <Input
                value={formData.companyName}
                onChange={handleChange('companyName')}
                placeholder="Mi Empresa SRL"
                className={errors.companyName ? 'border-red-500' : ''}
              />
              {errors.companyName && (
                <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email de la Empresa *
              </label>
              <Input
                type="email"
                value={formData.companyEmail}
                onChange={handleChange('companyEmail')}
                placeholder="contacto@miempresa.com"
                className={errors.companyEmail ? 'border-red-500' : ''}
              />
              {errors.companyEmail && (
                <p className="text-red-500 text-sm mt-1">{errors.companyEmail}</p>
              )}
            </div>
          </div>

          {/* Administrator Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b dark:border-gray-700 pb-2">
              Información del Administrador
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre Completo *
              </label>
              <Input
                value={formData.adminName}
                onChange={handleChange('adminName')}
                placeholder="Juan Pérez"
                className={errors.adminName ? 'border-red-500' : ''}
              />
              {errors.adminName && (
                <p className="text-red-500 text-sm mt-1">{errors.adminName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
              </label>
              <Input
                type="email"
                value={formData.adminEmail}
                onChange={handleChange('adminEmail')}
                placeholder="admin@miempresa.com"
                className={errors.adminEmail ? 'border-red-500' : ''}
              />
              {errors.adminEmail && (
                <p className="text-red-500 text-sm mt-1">{errors.adminEmail}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contraseña *
                </label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={handleChange('password')}
                  placeholder="••••••••"
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirmar Contraseña *
                </label>
                <Input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  placeholder="••••••••"
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              isLoading={loading}
            >
              Registrar Empresa
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/login')}
              disabled={loading}
            >
              Ya tengo una cuenta
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
