import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '@/lib/http';
import { useToast } from '@/components/ui/Toast';
import { Building2, Palette, Upload } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  email: string;
  branding?: {
    logo?: string;
    primaryColor?: string;
    description?: string;
  };
}

interface BrandingForm {
  logo: string;
  primaryColor: string;
  description: string;
  logoFile: File | null;
}

export function TenantSettings() {
  const { push } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  const { data: tenant, isLoading } = useQuery<Tenant>({
    queryKey: ['tenant', 'me'],
    queryFn: () => http.get('/api/v1/tenants/me'),
  });

  const [formData, setFormData] = useState<BrandingForm>({
    logo: tenant?.branding?.logo || '',
    primaryColor: tenant?.branding?.primaryColor || '#6366f1',
    description: tenant?.branding?.description || '',
    logoFile: null
  });

  // Actualizar form data cuando se cargue el tenant
  useState(() => {
    if (tenant?.branding) {
      setFormData({
        logo: tenant.branding.logo || '',
        primaryColor: tenant.branding.primaryColor || '#6366f1',
        description: tenant.branding.description || '',
        logoFile: null
      });
    }
  });

  const updateBranding = useMutation({
    mutationFn: async (data: Partial<BrandingForm>) => {
      if (!tenant) throw new Error('No tenant found');

      return http.patch(`/api/v1/tenants/${tenant.id}`, {
        branding: {
          logo: data.logo,
          primaryColor: data.primaryColor,
          description: data.description
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', 'me'] });
      push({
        kind: 'success',
        message: 'Configuración actualizada correctamente'
      });
    },
    onError: (error: any) => {
      push({
        kind: 'error',
        message: error.message || 'Error al actualizar la configuración'
      });
    }
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      push({
        kind: 'error',
        message: 'Solo se permiten archivos de imagen (JPG, PNG, SVG, WEBP)'
      });
      return;
    }

    // Validar tamaño (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      push({
        kind: 'error',
        message: 'La imagen no debe superar los 2MB'
      });
      return;
    }

    setIsUploading(true);

    try {
      // En una implementación real, subirías a un servicio de almacenamiento como S3
      // Por ahora, usamos un placeholder de data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setFormData({ ...formData, logo: dataUrl, logoFile: file });
        push({
          kind: 'info',
          message: 'Logo cargado. Haz clic en "Guardar cambios" para aplicar.'
        });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      push({
        kind: 'error',
        message: 'Error al cargar el logo'
      });
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar color hex
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!hexRegex.test(formData.primaryColor)) {
      push({
        kind: 'error',
        message: 'El color debe ser un código hexadecimal válido (ej: #6366f1)'
      });
      return;
    }

    updateBranding.mutate({
      logo: formData.logo,
      primaryColor: formData.primaryColor,
      description: formData.description
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Building2 className="size-6" />
          Configuración de Empresa
        </h1>
        <p className="text-sm text-[--color-muted] mt-1">
          Personaliza la apariencia de tu página de carreras públicas
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Upload className="size-5" />
            Logo de la Empresa
          </h2>

          <div className="flex items-start gap-6">
            {formData.logo && (
              <div className="w-32 h-32 border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex items-center justify-center bg-white dark:bg-gray-900">
                <img
                  src={formData.logo}
                  alt="Logo preview"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}

            <div className="flex-1">
              <label className="block border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors">
                <input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/svg+xml,image/webp"
                  onChange={handleLogoUpload}
                  disabled={isUploading}
                />
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {isUploading ? 'Subiendo...' : 'Subir logo'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG, SVG o WEBP hasta 2MB
                </p>
              </label>

              <div className="mt-3">
                <label className="label">O ingresa una URL</label>
                <input
                  type="url"
                  className="input"
                  value={formData.logo}
                  onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  placeholder="https://ejemplo.com/logo.png"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Color Primario */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Palette className="size-5" />
            Color Primario
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Código de color (hex)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input flex-1"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  placeholder="#6366f1"
                  maxLength={7}
                />
                <input
                  type="color"
                  className="w-14 h-10 rounded-lg cursor-pointer border border-gray-300 dark:border-gray-700"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Este color se aplicará a botones y elementos destacados en tu página de carreras
              </p>
            </div>

            <div className="flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Vista previa
                </p>
                <button
                  type="button"
                  className="font-medium py-2.5 px-6 rounded-lg text-white"
                  style={{ backgroundColor: formData.primaryColor }}
                >
                  Botón de ejemplo
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Descripción */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Descripción de la Empresa</h2>

          <div>
            <label className="label">
              Descripción (aparecerá en tu página de carreras)
            </label>
            <textarea
              className="input min-h-[120px]"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe tu empresa y cultura laboral..."
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/500 caracteres
            </p>
          </div>
        </div>

        {/* Información del Slug */}
        {tenant && (
          <div className="card bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800">
            <h3 className="text-sm font-semibold mb-2">URL de tu página de carreras</h3>
            <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 border border-indigo-200 dark:border-indigo-800">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/careers/${tenant.slug}`}
                className="flex-1 bg-transparent text-sm font-mono focus:outline-none"
                onClick={(e) => e.currentTarget.select()}
              />
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              if (tenant?.branding) {
                setFormData({
                  logo: tenant.branding.logo || '',
                  primaryColor: tenant.branding.primaryColor || '#6366f1',
                  description: tenant.branding.description || '',
                  logoFile: null
                });
              }
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={updateBranding.isPending}
          >
            {updateBranding.isPending ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
