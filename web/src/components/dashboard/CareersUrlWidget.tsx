import { useQuery } from '@tanstack/react-query';
import { Copy, ExternalLink, Users } from 'lucide-react';
import { http } from '@/lib/http';
import { useToast } from '../ui/Toast';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  email: string;
  analytics?: {
    totalApplications?: number;
    applicationsByCareersPage?: number;
    applicationsThisMonth?: number;
    lastApplicationDate?: string;
  };
}

export function CareersUrlWidget() {
  const { push } = useToast();

  const { data: tenant, isLoading } = useQuery<Tenant>({
    queryKey: ['tenant', 'me'],
    queryFn: () => http.get('/api/v1/tenants/me'),
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border bg-white/65 dark:bg-zinc-900/40 backdrop-blur-sm border-zinc-200/80 dark:border-white/10 p-4 shadow-sm animate-pulse">
        <div className="h-24" />
      </div>
    );
  }

  if (!tenant) {
    return null;
  }

  const careersUrl = `${window.location.origin}/careers/${tenant.slug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(careersUrl);
      push({
        kind: 'success',
        message: 'URL copiada al portapapeles',
      });
    } catch (error) {
      push({
        kind: 'error',
        message: 'Error al copiar la URL',
      });
    }
  };

  const handleOpenCareers = () => {
    window.open(careersUrl, '_blank');
  };

  return (
    <div className="rounded-2xl border bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border-indigo-200/50 dark:border-indigo-800/50 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
          <Users className="size-5 text-indigo-600 dark:text-indigo-400" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            Página de Carreras
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Comparte esta URL para recibir aplicaciones de candidatos
          </p>

          <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-800 mb-3">
            <input
              type="text"
              readOnly
              value={careersUrl}
              className="flex-1 bg-transparent text-xs font-mono text-gray-900 dark:text-white focus:outline-none truncate"
              onClick={(e) => e.currentTarget.select()}
            />
          </div>

          {tenant.analytics && (
            <div className="grid grid-cols-3 gap-2 mb-3 mt-3">
              <div className="bg-white dark:bg-gray-900 rounded-lg px-2 py-2 text-center border border-gray-200 dark:border-gray-800">
                <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {tenant.analytics.applicationsByCareersPage || 0}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Total
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-lg px-2 py-2 text-center border border-gray-200 dark:border-gray-800">
                <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {tenant.analytics.applicationsThisMonth || 0}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Este mes
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-lg px-2 py-2 text-center border border-gray-200 dark:border-gray-800">
                <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {tenant.analytics.lastApplicationDate
                    ? new Date(tenant.analytics.lastApplicationDate).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
                    : '-'}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Última
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
            >
              <Copy className="size-3.5" />
              Copiar URL
            </button>
            <button
              onClick={handleOpenCareers}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <ExternalLink className="size-3.5" />
              Ver página
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
