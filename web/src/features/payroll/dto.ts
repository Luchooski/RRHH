export type PayrollStatus = 'Borrador' | 'Aprobado';

export type Payroll = {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string;            // YYYY-MM
  baseSalary: number;
  bonuses?: number;
  overtimeHours?: number;
  overtimeRate?: number;
  deductions?: number;
  taxRate?: number;
  contributionsRate?: number;
  status: PayrollStatus;
  createdAt: string;
  updatedAt: string;
};

export type PayrollListOut = {
  items: Payroll[];
  total: number;
};
