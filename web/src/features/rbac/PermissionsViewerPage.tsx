import { Shield, Check, AlertCircle } from 'lucide-react';
import { useMyPermissions } from './hooks';
import {
  MODULE_LABELS,
  MODULE_ICONS,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  groupPermissionsByModule,
  getPermissionLabel,
  type Module,
} from './dto';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';

export default function PermissionsViewerPage() {
  const { data: userPermissions, isLoading, error } = useMyPermissions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando permisos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600">Error al cargar los permisos</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!userPermissions) return null;

  const hasAllPermissions = userPermissions.permissions.includes('*');
  const groupedPermissions = hasAllPermissions
    ? {}
    : groupPermissionsByModule(userPermissions.permissions);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mis Permisos</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Visualiza los permisos asignados a tu cuenta
        </p>
      </div>

      {/* Role Info */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-800/20 border-blue-200 dark:border-blue-800">
        <CardBody className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 text-white rounded-full p-4">
              <Shield className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Tu Rol</p>
              <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                {ROLE_LABELS[userPermissions.role] || userPermissions.role}
              </h2>
              {ROLE_DESCRIPTIONS[userPermissions.role] && (
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {ROLE_DESCRIPTIONS[userPermissions.role]}
                </p>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Permissions */}
      {hasAllPermissions ? (
        <Card className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-800/20 border-purple-200 dark:border-purple-800">
          <CardBody className="p-8 text-center">
            <div className="bg-purple-600 text-white rounded-full p-6 inline-block mb-4">
              <Shield className="h-12 w-12" />
            </div>
            <h3 className="text-2xl font-bold text-purple-900 dark:text-purple-200 mb-2">
              Acceso Total
            </h3>
            <p className="text-purple-700 dark:text-purple-300">
              Tienes todos los permisos del sistema. Puedes acceder y gestionar cualquier módulo.
            </p>
          </CardBody>
        </Card>
      ) : (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Permisos por Módulo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(groupedPermissions).map(([module, permissions]) => {
              const mod = module as Module;

              return (
                <Card key={module} className="border-l-4 border-l-green-500">
                  <CardBody className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">{MODULE_ICONS[mod]}</span>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {MODULE_LABELS[mod]}
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {permissions.map((permission) => {
                        const action = permission.split('.')[1];
                        return (
                          <div
                            key={permission}
                            className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                          >
                            <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <span className="capitalize">{action}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>

          {Object.keys(groupedPermissions).length === 0 && (
            <Card>
              <CardBody className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No tienes permisos asignados</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Contacta al administrador para solicitar permisos
                </p>
              </CardBody>
            </Card>
          )}
        </section>
      )}

      {/* Summary */}
      <Card className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardBody className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Total de Permisos
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {hasAllPermissions ? 'Ilimitado' : userPermissions.permissions.length}
              </p>
            </div>
            {hasAllPermissions && (
              <div className="text-purple-600">
                <Shield className="h-10 w-10" />
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
