export type Employee = {
  id: string;
  name: string;
  email: string;
  role: string;
  baseSalary: number;
  monthlyHours: number;
  phone?: string;
  createdAt: string;
  updatedAt: string;
};

export type EmployeeCreateInput = {
  name: string;
  email: string;
  role: string;
  baseSalary: number;
  monthlyHours: number;
  phone?: string;
};

export type EmployeeListOut = {
  items: Employee[];
  total: number;
};
