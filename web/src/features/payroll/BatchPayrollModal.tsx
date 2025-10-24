import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Users, Calendar, Settings, Check, AlertCircle } from 'lucide-react';
import { http } from '@/lib/api';

interface Employee {
  id: string;
  name: string;
  email: string;
  department?: string;
  salary?: number;
}

interface BatchPayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BatchResult {
  total: number;
  created: number;
  errors: Array<{ employeeId: string; employeeName: string; error: string }>;
  payrolls: any[];
}

export default function BatchPayrollModal({ isOpen, onClose }: BatchPayrollModalProps) {
  const [step, setStep] = useState(1);
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [options, setOptions] = useState({
    includeOvertime: true,
    includePresenteeism: true,
    includeAbsenceDeductions: true,
    includeBenefitsDeductions: true,
    overtimeRate: 1.5,
    absenceDeductionRate: 1.0,
  });
  const [result, setResult] = useState<BatchResult | null>(null);

  const queryClient = useQueryClient();

  // Fetch employees
  const { data: employeesData, isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees', 'active'],
    queryFn: () => http.get('/api/v1/employees', { auth: true, params: { status: 'active', limit: 1000 } }),
    enabled: isOpen,
  });

  const employees: Employee[] = employeesData?.items || [];

  // Batch create mutation
  const batchMutation = useMutation({
    mutationFn: (payload: any) => http.post('/api/v1/payrolls/batch', payload, { auth: true }),
    onSuccess: (data) => {
      setResult(data);
      setStep(4);
      queryClient.invalidateQueries({ queryKey: ['payrolls'] });
    },
  });

  const handleSelectAll = () => {
    if (selectedEmployeeIds.length === employees.length) {
      setSelectedEmployeeIds([]);
    } else {
      setSelectedEmployeeIds(employees.map((e: Employee) => e.id));
    }
  };

  const handleSelectEmployee = (id: string) => {
    if (selectedEmployeeIds.includes(id)) {
      setSelectedEmployeeIds(prev => prev.filter(eid => eid !== id));
    } else {
      setSelectedEmployeeIds(prev => [...prev, id]);
    }
  };

  const handleGenerate = () => {
    batchMutation.mutate({
      period,
      employeeIds: selectedEmployeeIds.length > 0 ? selectedEmployeeIds : undefined,
      includeAutoCalc: true,
      options,
    });
  };

  const handleClose = () => {
    setStep(1);
    setSelectedEmployeeIds([]);
    setResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-2xl font-semibold">Liquidación Masiva</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Genera liquidaciones automáticas para múltiples empleados
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 p-4 bg-zinc-50 dark:bg-zinc-900/50">
          {[
            { num: 1, label: 'Período', icon: Calendar },
            { num: 2, label: 'Empleados', icon: Users },
            { num: 3, label: 'Opciones', icon: Settings },
            { num: 4, label: 'Resultado', icon: Check },
          ].map(({ num, label, icon: Icon }) => (
            <div key={num} className="flex items-center">
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                  step === num
                    ? 'bg-blue-500 text-white'
                    : step > num
                    ? 'bg-green-500 text-white'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{label}</span>
              </div>
              {num < 4 && (
                <div
                  className={`w-8 h-0.5 mx-1 ${
                    step > num ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Period */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Período de liquidación (YYYY-MM)
                </label>
                <input
                  type="month"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value.slice(0, 7))}
                  className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800"
                />
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Nota:</strong> El sistema calculará automáticamente:
                </p>
                <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                  <li>Horas extra basadas en asistencia</li>
                  <li>Bonos por presentismo</li>
                  <li>Descuentos por ausencias</li>
                  <li>Aportes y deducciones legales</li>
                  <li>Deducciones por beneficios</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Employees */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Seleccionar empleados</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {selectedEmployeeIds.length === 0
                      ? 'Todos los empleados activos'
                      : `${selectedEmployeeIds.length} empleados seleccionados`}
                  </p>
                </div>
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                >
                  {selectedEmployeeIds.length === employees.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </button>
              </div>

              {loadingEmployees ? (
                <div className="text-center py-12 text-zinc-500">Cargando empleados...</div>
              ) : (
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg divide-y divide-zinc-200 dark:divide-zinc-800 max-h-96 overflow-y-auto">
                  {employees.map((emp: Employee) => (
                    <label
                      key={emp.id}
                      className="flex items-center gap-3 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEmployeeIds.includes(emp.id)}
                        onChange={() => handleSelectEmployee(emp.id)}
                        className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{emp.name}</div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400">
                          {emp.email}
                          {emp.department && ` • ${emp.department}`}
                        </div>
                      </div>
                      {emp.salary && (
                        <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                          ${emp.salary.toLocaleString()}
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Options */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="font-medium">Opciones de cálculo</h3>

              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <div>
                    <div className="font-medium">Incluir horas extra</div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      Calcula y paga las horas extra trabajadas
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={options.includeOvertime}
                    onChange={(e) => setOptions({ ...options, includeOvertime: e.target.checked })}
                    className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>

                {options.includeOvertime && (
                  <div className="ml-4 pl-4 border-l-2 border-blue-500">
                    <label className="block text-sm font-medium mb-2">
                      Multiplicador de horas extra
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="3"
                      value={options.overtimeRate}
                      onChange={(e) => setOptions({ ...options, overtimeRate: parseFloat(e.target.value) })}
                      className="w-32 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800"
                    />
                    <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">x (ej: 1.5 = 50% más)</span>
                  </div>
                )}

                <label className="flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <div>
                    <div className="font-medium">Bono por presentismo</div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      10% extra sin ausencias ni tardanzas
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={options.includePresenteeism}
                    onChange={(e) => setOptions({ ...options, includePresenteeism: e.target.checked })}
                    className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <div>
                    <div className="font-medium">Descuentos por ausencias</div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      Descontar días ausentes injustificados
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={options.includeAbsenceDeductions}
                    onChange={(e) => setOptions({ ...options, includeAbsenceDeductions: e.target.checked })}
                    className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <div>
                    <div className="font-medium">Deducciones por beneficios</div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      Incluir costos de beneficios del empleado
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={options.includeBenefitsDeductions}
                    onChange={(e) => setOptions({ ...options, includeBenefitsDeductions: e.target.checked })}
                    className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Step 4: Result */}
          {step === 4 && result && (
            <div className="space-y-6">
              {result.created > 0 && (
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">
                      ¡Liquidaciones generadas exitosamente!
                    </span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                    Se crearon {result.created} de {result.total} liquidaciones.
                  </p>
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200 mb-3">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">
                      {result.errors.length} errores encontrados
                    </span>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {result.errors.map((err, idx) => (
                      <div key={idx} className="text-sm text-yellow-700 dark:text-yellow-300 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded">
                        <div className="font-medium">{err.employeeName}</div>
                        <div className="text-xs">{err.error}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg">
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">Total</div>
                  <div className="text-2xl font-bold">{result.total}</div>
                </div>
                <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
                  <div className="text-sm text-green-600 dark:text-green-400">Creadas</div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">{result.created}</div>
                </div>
                <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg">
                  <div className="text-sm text-red-600 dark:text-red-400">Errores</div>
                  <div className="text-2xl font-bold text-red-700 dark:text-red-300">{result.errors.length}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={step === 1 ? handleClose : () => setStep(step - 1)}
            className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
            disabled={batchMutation.isPending}
          >
            {step === 1 ? 'Cancelar' : 'Anterior'}
          </button>

          <div className="flex gap-2">
            {step < 3 && (
              <button
                onClick={() => setStep(step + 1)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Siguiente
              </button>
            )}

            {step === 3 && (
              <button
                onClick={handleGenerate}
                disabled={batchMutation.isPending}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50"
              >
                {batchMutation.isPending ? 'Generando...' : 'Generar Liquidaciones'}
              </button>
            )}

            {step === 4 && (
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Finalizar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
