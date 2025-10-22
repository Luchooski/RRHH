import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import { http } from '../../lib/http';
import { Modal } from '../../components/ui/Modal';

type Payroll = {
  id: string;
  period: string;
  type: 'mensual' | 'final' | 'extraordinaria' | 'vacaciones';
  status: string;
  netTotal: number;
  currency: string;
  paymentDate?: string;
  createdAt: string;
};

type PayrollDetail = {
  id: string;
  employeeName: string;
  period: string;
  type: string;
  status: string;
  baseSalary: number;
  concepts: Array<{ code: string; label: string; amount: number }>;
  deductions: Array<{ code: string; label: string; amount: number }>;
  grossTotal: number;
  deductionsTotal: number;
  netTotal: number;
  currency: string;
  paymentMethod?: string;
  bankAccount?: string;
  paymentDate?: string;
  notes?: string;
};

export function EmployeePayrolls() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const { data, isLoading } = useQuery<{ items: Payroll[]; total: number }>({
    queryKey: ['employee-payrolls', year],
    queryFn: () => http.get(`/api/v1/employee-portal/payrolls?year=${year}`, { auth: true }),
  });

  const { data: detail, isLoading: detailLoading } = useQuery<PayrollDetail>({
    queryKey: ['employee-payroll-detail', selectedId],
    queryFn: () => http.get(`/api/v1/employee-portal/payrolls/${selectedId}`, { auth: true }),
    enabled: !!selectedId,
  });

  const handleDownloadPDF = async (id: string, period: string) => {
    try {
      const blob = await http.blob(`/api/v1/employee-portal/payrolls/${id}/receipt.pdf`, { auth: true });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recibo-${period}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner />
      </div>
    );
  }

  const payrolls = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mis Recibos de Pago
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Historial de liquidaciones y recibos
          </p>
        </div>

        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          {[...Array(5)].map((_, i) => {
            const y = new Date().getFullYear() - i;
            return <option key={y} value={y}>{y}</option>;
          })}
        </select>
      </div>

      {payrolls.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No hay recibos para el año seleccionado
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {payrolls.map((payroll) => (
            <Card key={payroll.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {payroll.period}
                    </h3>
                    <Badge variant={payroll.status === 'pagada' ? 'success' : 'default'}>
                      {payroll.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                    <span>Tipo: {payroll.type}</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      Neto: {payroll.currency} {payroll.netTotal.toLocaleString()}
                    </span>
                    {payroll.paymentDate && (
                      <span>Pagado: {new Date(payroll.paymentDate).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedId(payroll.id)}
                  >
                    Ver Detalle
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleDownloadPDF(payroll.id, payroll.period)}
                  >
                    📥 PDF
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedId}
        onClose={() => setSelectedId(null)}
        title="Detalle del Recibo"
      >
        {detailLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : detail ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Período:</span>
                <p className="font-semibold text-gray-900 dark:text-white">{detail.period}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Estado:</span>
                <p className="font-semibold text-gray-900 dark:text-white">{detail.status}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Salario Base</h4>
              <p className="text-lg">{detail.currency} {detail.baseSalary.toLocaleString()}</p>
            </div>

            {detail.concepts.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Conceptos</h4>
                <div className="space-y-2">
                  {detail.concepts.map((c, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{c.label}</span>
                      <span className="font-medium">{detail.currency} {c.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detail.deductions.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Deducciones</h4>
                <div className="space-y-2">
                  {detail.deductions.map((d, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{d.label}</span>
                      <span className="font-medium text-red-600">-{detail.currency} {d.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t dark:border-gray-700 pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Bruto:</span>
                <span className="font-semibold">{detail.currency} {detail.grossTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Deducciones:</span>
                <span className="font-semibold text-red-600">-{detail.currency} {detail.deductionsTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="font-bold text-gray-900 dark:text-white">Total Neto:</span>
                <span className="font-bold text-green-600">{detail.currency} {detail.netTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => handleDownloadPDF(detail.id, detail.period)}
              >
                Descargar PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedId(null)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
