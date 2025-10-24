import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useBenefits, useCreateBenefit, useUpdateBenefit, useDeleteBenefit } from './hooks';
import { useToast } from '@/components/ui/Toast';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import {
  BENEFIT_TYPE_LABELS,
  BENEFIT_TYPE_ICONS,
  BENEFIT_FREQUENCY_LABELS,
  BENEFIT_STATUS_LABELS,
  BENEFIT_STATUS_COLORS,
  type BenefitType,
  type BenefitStatus,
  type BenefitFrequency,
  type Benefit,
  type CreateBenefitInput,
} from './dto';

export default function BenefitsManagementPage() {
  const { push } = useToast();

  const [typeFilter, setTypeFilter] = useState<BenefitType | ''>('');
  const [statusFilter, setStatusFilter] = useState<BenefitStatus | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null);

  const { data: benefits, refetch } = useBenefits({
    type: typeFilter || undefined,
    status: statusFilter || undefined,
  });

  const createBenefit = useCreateBenefit();
  const updateBenefit = useUpdateBenefit(editingBenefit?._id || '');
  const deleteBenefit = useDeleteBenefit();

  const [form, setForm] = useState<CreateBenefitInput>({
    name: '',
    description: '',
    type: 'health_insurance',
    costToCompany: 0,
    costToEmployee: 0,
    frequency: 'monthly',
    currency: 'ARS',
    provider: '',
    providerContact: '',
    terms: '',
    isOptional: true,
    requiresApproval: false,
    eligibility: {
      minMonthsEmployment: undefined,
      roles: [],
      employmentType: [],
      departments: [],
    },
  });

  const handleOpenModal = (benefit?: Benefit) => {
    if (benefit) {
      setEditingBenefit(benefit);
      setForm({
        name: benefit.name,
        description: benefit.description || '',
        type: benefit.type,
        costToCompany: benefit.costToCompany,
        costToEmployee: benefit.costToEmployee,
        frequency: benefit.frequency,
        currency: benefit.currency,
        provider: benefit.provider,
        providerContact: benefit.providerContact,
        terms: benefit.terms,
        isOptional: benefit.isOptional,
        requiresApproval: benefit.requiresApproval,
        eligibility: benefit.eligibility,
      });
    } else {
      setEditingBenefit(null);
      setForm({
        name: '',
        description: '',
        type: 'health_insurance',
        costToCompany: 0,
        costToEmployee: 0,
        frequency: 'monthly',
        currency: 'ARS',
        provider: '',
        providerContact: '',
        terms: '',
        isOptional: true,
        requiresApproval: false,
        eligibility: {},
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBenefit(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingBenefit) {
        await updateBenefit.mutateAsync(form);
        push({ kind: 'success', title: 'Actualizado', message: 'El beneficio fue actualizado correctamente' });
      } else {
        await createBenefit.mutateAsync(form);
        push({ kind: 'success', title: 'Creado', message: 'El beneficio fue creado correctamente' });
      }
      handleCloseModal();
      refetch();
    } catch (error: any) {
      push({ kind: 'error', title: 'Error', message: error?.message || 'No se pudo guardar el beneficio' });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar el beneficio "${name}"?`)) {
      return;
    }

    try {
      await deleteBenefit.mutateAsync(id);
      push({ kind: 'success', title: 'Eliminado', message: 'El beneficio fue eliminado correctamente' });
      refetch();
    } catch (error: any) {
      push({ kind: 'error', title: 'Error', message: error?.message || 'No se pudo eliminar el beneficio' });
    }
  };

  const items = benefits || [];

  return (
    <div className="container space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Gestión de Beneficios</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Administra el catálogo de beneficios</p>
        </div>
        <Button onClick={() => handleOpenModal()} variant="primary">
          <Plus size={18} />
          Nuevo Beneficio
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Tipo"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as BenefitType | '')}
            >
              <option value="">Todos</option>
              {Object.entries(BENEFIT_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {BENEFIT_TYPE_ICONS[key as BenefitType]} {label}
                </option>
              ))}
            </Select>

            <Select
              label="Estado"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as BenefitStatus | '')}
            >
              <option value="">Todos</option>
              {Object.entries(BENEFIT_STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>

            <div className="flex items-end">
              <Button
                onClick={() => {
                  setTypeFilter('');
                  setStatusFilter('');
                }}
                variant="ghost"
              >
                Limpiar filtros
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((benefit) => (
          <Card key={benefit._id} className="hover:shadow-lg transition-shadow">
            <CardBody>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{BENEFIT_TYPE_ICONS[benefit.type]}</span>
                  <div>
                    <h3 className="font-semibold text-lg">{benefit.name}</h3>
                    <p className="text-xs text-gray-500">{BENEFIT_TYPE_LABELS[benefit.type]}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${BENEFIT_STATUS_COLORS[benefit.status]}`}>
                  {BENEFIT_STATUS_LABELS[benefit.status]}
                </span>
              </div>

              {benefit.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {benefit.description}
                </p>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Costo Empresa:</span>
                  <span className="font-medium">
                    {benefit.currency} ${benefit.costToCompany} / {BENEFIT_FREQUENCY_LABELS[benefit.frequency]}
                  </span>
                </div>
                {benefit.costToEmployee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Costo Empleado:</span>
                    <span className="font-medium">
                      {benefit.currency} ${benefit.costToEmployee}
                    </span>
                  </div>
                )}
                {benefit.provider && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Proveedor:</span>
                    <span className="font-medium">{benefit.provider}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={() => handleOpenModal(benefit)}
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                >
                  <Edit2 size={16} />
                  Editar
                </Button>
                <Button
                  onClick={() => handleDelete(benefit._id, benefit.name)}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {items.length === 0 && (
        <Card>
          <CardBody>
            <p className="text-center text-gray-500 py-8">
              No hay beneficios en el catálogo. Crea el primero haciendo clic en "Nuevo Beneficio".
            </p>
          </CardBody>
        </Card>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold">
                {editingBenefit ? 'Editar Beneficio' : 'Nuevo Beneficio'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Input
                label="Nombre *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Tipo *"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as BenefitType })}
                  required
                >
                  {Object.entries(BENEFIT_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {BENEFIT_TYPE_ICONS[key as BenefitType]} {label}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Frecuencia *"
                  value={form.frequency}
                  onChange={(e) => setForm({ ...form, frequency: e.target.value as BenefitFrequency })}
                  required
                >
                  {Object.entries(BENEFIT_FREQUENCY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>

              <textarea
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900"
                rows={3}
                placeholder="Descripción"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />

              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Costo Empresa *"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.costToCompany}
                  onChange={(e) => setForm({ ...form, costToCompany: parseFloat(e.target.value) || 0 })}
                  required
                />
                <Input
                  label="Costo Empleado"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.costToEmployee}
                  onChange={(e) => setForm({ ...form, costToEmployee: parseFloat(e.target.value) || 0 })}
                />
                <Input
                  label="Moneda"
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Proveedor"
                  value={form.provider}
                  onChange={(e) => setForm({ ...form, provider: e.target.value })}
                />
                <Input
                  label="Contacto Proveedor"
                  value={form.providerContact}
                  onChange={(e) => setForm({ ...form, providerContact: e.target.value })}
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isOptional}
                    onChange={(e) => setForm({ ...form, isOptional: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Es opcional</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.requiresApproval}
                    onChange={(e) => setForm({ ...form, requiresApproval: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Requiere aprobación</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button type="button" onClick={handleCloseModal} variant="ghost">
                  Cancelar
                </Button>
                <Button type="submit" variant="primary">
                  {editingBenefit ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
