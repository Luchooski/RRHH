import { useState } from 'react';
import { Shield, Plus, Edit2, Trash2, AlertCircle, Check } from 'lucide-react';
import { useRoles, useAllPermissions, useCreateRole, useUpdateRole, useDeleteRole } from './hooks';
import {
  MODULE_LABELS,
  MODULE_ICONS,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_COLORS,
  PERMISSIONS_BY_MODULE,
  getPermissionLabel,
  groupPermissionsByModule,
  type Role,
  type Permission,
  type Module,
} from './dto';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';

export default function RolesManagementPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as Permission[],
  });

  const { data: roles, isLoading, error } = useRoles();
  const { data: allPermissions } = useAllPermissions();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();

  const handleOpenCreate = () => {
    setEditingRole(null);
    setFormData({ name: '', description: '', permissions: [] });
    setShowModal(true);
  };

  const handleOpenEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRole(null);
    setFormData({ name: '', description: '', permissions: [] });
  };

  const handleTogglePermission = (permission: Permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const handleToggleAllModulePermissions = (module: Module) => {
    const modulePermissions = PERMISSIONS_BY_MODULE[module];
    const allSelected = modulePermissions.every(p => formData.permissions.includes(p));

    setFormData(prev => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter(p => !modulePermissions.includes(p))
        : [...new Set([...prev.permissions, ...modulePermissions])],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || formData.permissions.length === 0) {
      alert('El nombre y al menos un permiso son requeridos');
      return;
    }

    try {
      if (editingRole) {
        await updateRole.mutateAsync({
          id: editingRole._id,
          input: {
            name: formData.name,
            description: formData.description || undefined,
            permissions: formData.permissions,
          },
        });
      } else {
        await createRole.mutateAsync({
          name: formData.name,
          description: formData.description || undefined,
          permissions: formData.permissions,
        });
      }

      handleCloseModal();
    } catch (error: any) {
      alert(`Error: ${error.message || 'No se pudo guardar el rol'}`);
    }
  };

  const handleDelete = async (role: Role) => {
    if (!role.isCustom) {
      alert('No puedes eliminar roles predefinidos del sistema');
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar el rol "${role.name}"?`)) {
      return;
    }

    try {
      await deleteRole.mutateAsync(role._id);
    } catch (error: any) {
      alert(`Error: ${error.message || 'No se pudo eliminar el rol'}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando roles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600">Error al cargar los roles</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  const predefinedRoles = roles?.filter(r => !r.isCustom) || [];
  const customRoles = roles?.filter(r => r.isCustom) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Roles</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Administra roles y permisos para controlar el acceso al sistema
          </p>
        </div>
        <button onClick={handleOpenCreate} className="btn btn-primary">
          <Plus className="h-5 w-5 mr-2" />
          Crear Rol Personalizado
        </button>
      </div>

      {/* Predefined Roles */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Roles Predefinidos del Sistema
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {predefinedRoles.map((role) => (
            <Card key={role._id} className="border-l-4" style={{ borderLeftColor: getRoleColor(role.name) }}>
              <CardBody>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {ROLE_LABELS[role.name] || role.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {ROLE_DESCRIPTIONS[role.name] || role.description || 'Rol predefinido del sistema'}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                    Sistema
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Permisos:</p>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {role.permissions.includes('*') ? (
                      <span className="font-semibold text-purple-600">Todos los permisos</span>
                    ) : (
                      <span>{role.permissions.length} permisos asignados</span>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* Custom Roles */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-amber-600" />
          Roles Personalizados
        </h2>
        {customRoles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customRoles.map((role) => (
              <Card key={role._id} className="border-l-4 border-l-amber-500">
                <CardBody>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold">{role.name}</h3>
                      {role.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{role.description}</p>
                      )}
                    </div>
                    <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 text-xs rounded-full">
                      Personalizado
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Permisos:</p>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {role.permissions.includes('*') ? (
                        <span className="font-semibold text-purple-600">Todos los permisos</span>
                      ) : (
                        <span>{role.permissions.length} permisos asignados</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleOpenEdit(role)}
                      className="btn btn-ghost flex-1"
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(role)}
                      className="btn btn-ghost text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardBody className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No hay roles personalizados aún</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Crea roles personalizados para adaptarse a las necesidades de tu organización
              </p>
              <button onClick={handleOpenCreate} className="btn btn-primary mt-4">
                <Plus className="h-5 w-5 mr-2" />
                Crear Primer Rol
              </button>
            </CardBody>
          </Card>
        )}
      </section>

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingRole ? 'Editar Rol' : 'Crear Rol Personalizado'}
              </h2>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="px-6 py-4 space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre del Rol *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="input w-full"
                      placeholder="ej: Coordinador de RRHH"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Descripción
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="input w-full"
                      rows={3}
                      placeholder="Descripción del rol y sus responsabilidades..."
                    />
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Permisos * (selecciona al menos uno)
                  </label>
                  <div className="space-y-4">
                    {Object.entries(PERMISSIONS_BY_MODULE).map(([module, permissions]) => {
                      const mod = module as Module;
                      const allSelected = permissions.every(p => formData.permissions.includes(p));
                      const someSelected = permissions.some(p => formData.permissions.includes(p));

                      return (
                        <Card key={module} className="border">
                          <CardBody className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{MODULE_ICONS[mod]}</span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {MODULE_LABELS[mod]}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleToggleAllModulePermissions(mod)}
                                className="text-sm text-blue-600 hover:underline"
                              >
                                {allSelected ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                              </button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {permissions.map((permission) => (
                                <label
                                  key={permission}
                                  className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                  <input
                                    type="checkbox"
                                    checked={formData.permissions.includes(permission)}
                                    onChange={() => handleTogglePermission(permission)}
                                    className="rounded text-blue-600"
                                  />
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {permission.split('.')[1]}
                                  </span>
                                  {formData.permissions.includes(permission) && (
                                    <Check className="h-4 w-4 text-green-600 ml-auto" />
                                  )}
                                </label>
                              ))}
                            </div>
                          </CardBody>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Summary */}
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <CardBody className="p-4">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                      Total de permisos seleccionados: {formData.permissions.length}
                    </p>
                  </CardBody>
                </Card>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn btn-ghost"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createRole.isPending || updateRole.isPending}
                >
                  {createRole.isPending || updateRole.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : editingRole ? (
                    'Actualizar Rol'
                  ) : (
                    'Crear Rol'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function getRoleColor(roleName: string): string {
  const colorMap: Record<string, string> = {
    admin: '#ef4444',
    hr: '#3b82f6',
    employee: '#6b7280',
    manager: '#8b5cf6',
    recruiter: '#10b981',
  };

  return colorMap[roleName] || '#f59e0b';
}
