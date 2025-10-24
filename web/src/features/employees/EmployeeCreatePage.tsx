import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useCreateEmployee } from './hooks';
import type { EmployeeCreateInput } from './dto';
import { useToast } from '@/components/ui/Toast';
import { ChevronLeft } from 'lucide-react';

type Tab = 'basicos' | 'personales' | 'direccion' | 'emergencia' | 'laborales' | 'financieros' | 'adicionales';

export default function EmployeeCreatePage() {
  const navigate = useNavigate();
  const { push } = useToast();
  const create = useCreateEmployee();
  const [activeTab, setActiveTab] = useState<Tab>('basicos');

  const [form, setForm] = useState<EmployeeCreateInput>({
    name: '',
    email: '',
    role: '',
    baseSalary: 0,
    monthlyHours: 160,
    phone: '',
    dni: '',
    cuil: '',
    dateOfBirth: '',
    gender: '',
    maritalStatus: '',
    nationality: 'Argentina',
    address: {
      street: '',
      number: '',
      floor: '',
      apartment: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Argentina',
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
      alternativePhone: '',
    },
    department: '',
    managerId: '',
    hireDate: '',
    endDate: '',
    contractType: 'fulltime',
    status: 'active',
    bankInfo: {
      bankName: '',
      accountType: 'savings',
      cbu: '',
      alias: '',
    },
    healthInsurance: '',
    taxId: '',
    skills: [],
    certifications: [],
    notes: '',
  });

  const [skillInput, setSkillInput] = useState('');
  const [certInput, setCertInput] = useState('');

  const onCreate = async () => {
    if (!form.name || !form.email || !form.role) {
      push({ kind: 'error', title: 'Error', message: 'Completa los campos obligatorios (nombre, email, rol)' });
      setActiveTab('basicos');
      return;
    }

    try {
      await create.mutateAsync(form);
      push({ kind: 'success', title: 'Empleado creado', message: `${form.name} fue creado correctamente` });
      navigate('/empleados');
    } catch (error: any) {
      push({ kind: 'error', title: 'Error', message: error?.message ?? 'No se pudo crear el empleado' });
    }
  };

  const addSkill = () => {
    if (skillInput.trim()) {
      setForm((f) => ({ ...f, skills: [...(f.skills || []), skillInput.trim()] }));
      setSkillInput('');
    }
  };

  const removeSkill = (idx: number) => {
    setForm((f) => ({ ...f, skills: f.skills?.filter((_, i) => i !== idx) }));
  };

  const addCert = () => {
    if (certInput.trim()) {
      setForm((f) => ({ ...f, certifications: [...(f.certifications || []), certInput.trim()] }));
      setCertInput('');
    }
  };

  const removeCert = (idx: number) => {
    setForm((f) => ({ ...f, certifications: f.certifications?.filter((_, i) => i !== idx) }));
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'basicos', label: 'Datos Básicos' },
    { key: 'personales', label: 'Datos Personales' },
    { key: 'direccion', label: 'Dirección' },
    { key: 'emergencia', label: 'Contacto Emergencia' },
    { key: 'laborales', label: 'Datos Laborales' },
    { key: 'financieros', label: 'Info Financiera' },
    { key: 'adicionales', label: 'Información Adicional' },
  ];

  return (
    <div className="container space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate('/empleados')}>
          <ChevronLeft size={18} />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Nuevo Empleado</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Completa toda la información del empleado</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="-mb-px flex space-x-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors
                ${
                  activeTab === tab.key
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <Card>
        <CardBody className="space-y-4">
          {/* Tab: Datos Básicos */}
          {activeTab === 'basicos' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nombre completo <span className="text-red-500">*</span>
                </label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Rol / Cargo <span className="text-red-500">*</span>
                </label>
                <Input value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} placeholder="ej: Desarrollador Sr." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Teléfono</label>
                <Input value={form.phone || ''} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+54 11 1234-5678" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Sueldo base (ARS) <span className="text-red-500">*</span>
                </label>
                <Input type="number" value={form.baseSalary} onChange={(e) => setForm((f) => ({ ...f, baseSalary: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Horas mensuales</label>
                <Input type="number" value={form.monthlyHours} onChange={(e) => setForm((f) => ({ ...f, monthlyHours: Number(e.target.value) }))} />
              </div>
            </div>
          )}

          {/* Tab: Datos Personales */}
          {activeTab === 'personales' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">DNI</label>
                <Input value={form.dni || ''} onChange={(e) => setForm((f) => ({ ...f, dni: e.target.value }))} placeholder="12345678" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CUIL</label>
                <Input value={form.cuil || ''} onChange={(e) => setForm((f) => ({ ...f, cuil: e.target.value }))} placeholder="20-12345678-9" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fecha de nacimiento</label>
                <Input type="date" value={form.dateOfBirth || ''} onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Género</label>
                <Select value={form.gender || ''} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value as any }))}>
                  <option value="">-- Seleccionar --</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="X">No binario</option>
                  <option value="other">Otro</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Estado civil</label>
                <Select value={form.maritalStatus || ''} onChange={(e) => setForm((f) => ({ ...f, maritalStatus: e.target.value as any }))}>
                  <option value="">-- Seleccionar --</option>
                  <option value="single">Soltero/a</option>
                  <option value="married">Casado/a</option>
                  <option value="divorced">Divorciado/a</option>
                  <option value="widowed">Viudo/a</option>
                  <option value="other">Otro</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nacionalidad</label>
                <Input value={form.nationality || ''} onChange={(e) => setForm((f) => ({ ...f, nationality: e.target.value }))} />
              </div>
            </div>
          )}

          {/* Tab: Dirección */}
          {activeTab === 'direccion' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">Calle</label>
                <Input
                  value={form.address?.street || ''}
                  onChange={(e) => setForm((f) => ({ ...f, address: { ...f.address, street: e.target.value } }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Número</label>
                <Input
                  value={form.address?.number || ''}
                  onChange={(e) => setForm((f) => ({ ...f, address: { ...f.address, number: e.target.value } }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Piso</label>
                <Input
                  value={form.address?.floor || ''}
                  onChange={(e) => setForm((f) => ({ ...f, address: { ...f.address, floor: e.target.value } }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Depto/Oficina</label>
                <Input
                  value={form.address?.apartment || ''}
                  onChange={(e) => setForm((f) => ({ ...f, address: { ...f.address, apartment: e.target.value } }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ciudad</label>
                <Input
                  value={form.address?.city || ''}
                  onChange={(e) => setForm((f) => ({ ...f, address: { ...f.address, city: e.target.value } }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Provincia/Estado</label>
                <Input
                  value={form.address?.state || ''}
                  onChange={(e) => setForm((f) => ({ ...f, address: { ...f.address, state: e.target.value } }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Código Postal</label>
                <Input
                  value={form.address?.postalCode || ''}
                  onChange={(e) => setForm((f) => ({ ...f, address: { ...f.address, postalCode: e.target.value } }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">País</label>
                <Input
                  value={form.address?.country || ''}
                  onChange={(e) => setForm((f) => ({ ...f, address: { ...f.address, country: e.target.value } }))}
                />
              </div>
            </div>
          )}

          {/* Tab: Contacto de Emergencia */}
          {activeTab === 'emergencia' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre completo</label>
                <Input
                  value={form.emergencyContact?.name || ''}
                  onChange={(e) => setForm((f) => ({ ...f, emergencyContact: { ...f.emergencyContact, name: e.target.value } }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Relación</label>
                <Input
                  value={form.emergencyContact?.relationship || ''}
                  onChange={(e) => setForm((f) => ({ ...f, emergencyContact: { ...f.emergencyContact, relationship: e.target.value } }))}
                  placeholder="ej: Esposo/a, Padre/Madre, Hermano/a"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Teléfono</label>
                <Input
                  value={form.emergencyContact?.phone || ''}
                  onChange={(e) => setForm((f) => ({ ...f, emergencyContact: { ...f.emergencyContact, phone: e.target.value } }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Teléfono alternativo</label>
                <Input
                  value={form.emergencyContact?.alternativePhone || ''}
                  onChange={(e) => setForm((f) => ({ ...f, emergencyContact: { ...f.emergencyContact, alternativePhone: e.target.value } }))}
                />
              </div>
            </div>
          )}

          {/* Tab: Datos Laborales */}
          {activeTab === 'laborales' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">Departamento</label>
                <Input value={form.department || ''} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} placeholder="ej: IT, RRHH, Ventas" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Manager ID</label>
                <Input value={form.managerId || ''} onChange={(e) => setForm((f) => ({ ...f, managerId: e.target.value }))} placeholder="ID del manager/supervisor" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fecha de ingreso</label>
                <Input type="date" value={form.hireDate || ''} onChange={(e) => setForm((f) => ({ ...f, hireDate: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fecha de baja (si aplica)</label>
                <Input type="date" value={form.endDate || ''} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de contrato</label>
                <Select value={form.contractType || 'fulltime'} onChange={(e) => setForm((f) => ({ ...f, contractType: e.target.value as any }))}>
                  <option value="fulltime">Tiempo completo</option>
                  <option value="parttime">Medio tiempo</option>
                  <option value="contract">Contratista</option>
                  <option value="temporary">Temporal</option>
                  <option value="intern">Pasante</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Estado</label>
                <Select value={form.status || 'active'} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as any }))}>
                  <option value="active">Activo</option>
                  <option value="on_leave">De licencia</option>
                  <option value="suspended">Suspendido</option>
                  <option value="terminated">Dado de baja</option>
                </Select>
              </div>
            </div>
          )}

          {/* Tab: Información Financiera */}
          {activeTab === 'financieros' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">Banco</label>
                <Input
                  value={form.bankInfo?.bankName || ''}
                  onChange={(e) => setForm((f) => ({ ...f, bankInfo: { ...f.bankInfo, bankName: e.target.value } }))}
                  placeholder="ej: Banco Nación, Santander"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de cuenta</label>
                <Select
                  value={form.bankInfo?.accountType || 'savings'}
                  onChange={(e) => setForm((f) => ({ ...f, bankInfo: { ...f.bankInfo, accountType: e.target.value as any } }))}
                >
                  <option value="savings">Caja de ahorros</option>
                  <option value="checking">Cuenta corriente</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CBU</label>
                <Input
                  value={form.bankInfo?.cbu || ''}
                  onChange={(e) => setForm((f) => ({ ...f, bankInfo: { ...f.bankInfo, cbu: e.target.value } }))}
                  placeholder="22 dígitos"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Alias</label>
                <Input
                  value={form.bankInfo?.alias || ''}
                  onChange={(e) => setForm((f) => ({ ...f, bankInfo: { ...f.bankInfo, alias: e.target.value } }))}
                  placeholder="alias.bancario"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Obra Social</label>
                <Input value={form.healthInsurance || ''} onChange={(e) => setForm((f) => ({ ...f, healthInsurance: e.target.value }))} placeholder="ej: OSDE, Swiss Medical" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CUIT/CUIL Fiscal</label>
                <Input value={form.taxId || ''} onChange={(e) => setForm((f) => ({ ...f, taxId: e.target.value }))} />
              </div>
            </div>
          )}

          {/* Tab: Información Adicional */}
          {activeTab === 'adicionales' && (
            <div className="space-y-4">
              {/* Skills */}
              <div>
                <label className="block text-sm font-medium mb-1">Habilidades</label>
                <div className="flex gap-2 mb-2">
                  <Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder="ej: React, Node.js" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())} />
                  <Button onClick={addSkill}>Agregar</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.skills?.map((skill, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-indigo-100 dark:bg-indigo-900 px-3 py-1 text-sm">
                      {skill}
                      <button onClick={() => removeSkill(idx)} className="hover:text-red-600">×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div>
                <label className="block text-sm font-medium mb-1">Certificaciones</label>
                <div className="flex gap-2 mb-2">
                  <Input value={certInput} onChange={(e) => setCertInput(e.target.value)} placeholder="ej: AWS Certified" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCert())} />
                  <Button onClick={addCert}>Agregar</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.certifications?.map((cert, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900 px-3 py-1 text-sm">
                      {cert}
                      <button onClick={() => removeCert(idx)} className="hover:text-red-600">×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-1">Notas</label>
                <textarea
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 min-h-[100px]"
                  value={form.notes || ''}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Notas adicionales sobre el empleado..."
                />
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Action buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={() => navigate('/empleados')}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={onCreate} disabled={create.isPending}>
          {create.isPending ? 'Creando...' : 'Crear empleado'}
        </Button>
      </div>
    </div>
  );
}
