export type Address = {
  street?: string;
  number?: string;
  floor?: string;
  apartment?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

export type EmergencyContact = {
  name?: string;
  relationship?: string;
  phone?: string;
  alternativePhone?: string;
};

export type BankInfo = {
  bankName?: string;
  accountType?: 'savings' | 'checking';
  cbu?: string;
  alias?: string;
};

export type JobHistoryEntry = {
  position: string;
  department?: string;
  startDate: string;
  endDate?: string;
  salary?: number;
  notes?: string;
};

export type Employee = {
  id: string;
  tenantId: string;

  // Datos básicos
  name: string;
  email: string;
  phone?: string;

  // Datos personales
  dni?: string;
  cuil?: string;
  dateOfBirth?: string;
  gender?: 'M' | 'F' | 'X' | 'other' | '';
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed' | 'other' | '';
  nationality?: string;

  // Dirección y contacto de emergencia
  address?: Address;
  emergencyContact?: EmergencyContact;

  // Datos laborales
  role: string;
  department?: string;
  managerId?: string;
  hireDate?: string;
  endDate?: string;
  baseSalary: number;
  monthlyHours: number;
  contractType?: 'fulltime' | 'parttime' | 'contract' | 'temporary' | 'intern' | '';

  // Estado
  status: 'active' | 'on_leave' | 'suspended' | 'terminated';

  // Información financiera
  bankInfo?: BankInfo;
  healthInsurance?: string;
  taxId?: string;

  // Información adicional
  photo?: string;
  skills?: string[];
  certifications?: string[];

  // Historial laboral
  jobHistory?: JobHistoryEntry[];

  notes?: string;

  createdAt: string;
  updatedAt: string;
};

export type EmployeeCreateInput = {
  // Datos básicos (requeridos)
  name: string;
  email: string;
  role: string;
  baseSalary: number;
  monthlyHours: number;

  // Datos opcionales
  phone?: string;
  dni?: string;
  cuil?: string;
  dateOfBirth?: string;
  gender?: 'M' | 'F' | 'X' | 'other' | '';
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed' | 'other' | '';
  nationality?: string;

  address?: Address;
  emergencyContact?: EmergencyContact;

  department?: string;
  managerId?: string;
  hireDate?: string;
  endDate?: string;
  contractType?: 'fulltime' | 'parttime' | 'contract' | 'temporary' | 'intern' | '';
  status?: 'active' | 'on_leave' | 'suspended' | 'terminated';

  bankInfo?: BankInfo;
  healthInsurance?: string;
  taxId?: string;

  photo?: string;
  skills?: string[];
  certifications?: string[];

  notes?: string;
};

export type EmployeeUpdateInput = Partial<EmployeeCreateInput>;

export type EmployeeListOut = {
  items: Employee[];
  total: number;
};
