export type EmployeeMock = {
  id: string;
  name: string;
  role: string;
  email: string;
  baseSalary: number;
  monthlyHours: number;
};

export const employees: EmployeeMock[] = [
  {
    id: 'e1',
    name: 'Juan Pérez',
    role: 'Desarrollador SR',
    email: 'juan.perez@example.com',
    baseSalary: 300000,
    monthlyHours: 160
  },
  {
    id: 'e2',
    name: 'Laura Gómez',
    role: 'Recruiter',
    email: 'laura.gomez@example.com',
    baseSalary: 280000,
    monthlyHours: 160
  },
  {
    id: 'e3',
    name: 'Ana Ruiz',
    role: 'HR Generalist',
    email: 'ana.ruiz@example.com',
    baseSalary: 320000,
    monthlyHours: 160
  }
];
