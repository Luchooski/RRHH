export type LeaveType = 'vacation' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'bereavement' | 'study' | 'unpaid' | 'other';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type Leave = {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;

  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  halfDay: boolean;

  reason: string;
  description?: string;

  status: LeaveStatus;
  requestedAt: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectedReason?: string;

  attachments?: string[];
  notes?: string;

  createdAt: string;
  updatedAt: string;
};

export type LeaveCreateInput = {
  type: LeaveType;
  startDate: string;
  endDate: string;
  halfDay?: boolean;
  reason: string;
  description?: string;
  attachments?: string[];
};

export type LeaveUpdateInput = Partial<LeaveCreateInput>;

export type LeaveApproveInput = {
  approved: boolean;
  rejectedReason?: string;
};

export type LeaveBalance = {
  vacation: {
    total: number;
    used: number;
    pending: number;
    available: number;
  };
  sick: {
    total: number;
    used: number;
    pending: number;
    available: number;
  };
  other: {
    used: number;
    pending: number;
  };
};

export type LeaveListOut = {
  items: Leave[];
  total: number;
};

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  vacation: 'Vacaciones',
  sick: 'Enfermedad',
  personal: 'Personal',
  maternity: 'Maternidad',
  paternity: 'Paternidad',
  bereavement: 'Duelo',
  study: 'Estudio',
  unpaid: 'Sin goce de sueldo',
  other: 'Otro',
};

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
};
