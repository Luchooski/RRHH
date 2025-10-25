import { Leave, LeaveDoc } from './leave.model.js';
import { Employee } from '../employee/employee.model.js';
import type { LeaveRequest, LeaveApproval, LeaveBalance } from './leave.dto.js';

/**
 * Crea una solicitud de licencia
 */
export async function createLeaveRequest(
  tenantId: string,
  data: LeaveRequest
): Promise<LeaveDoc> {
  // Buscar empleado
  const employee = await Employee.findOne({
    _id: data.employeeId,
    tenantId
  }).lean();

  if (!employee) {
    throw new Error('EMPLOYEE_NOT_FOUND');
  }

  // Parsear fechas
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);

  // Validar que endDate >= startDate
  if (endDate < startDate) {
    throw new Error('END_DATE_BEFORE_START_DATE');
  }

  // Calcular días laborables
  const days = Leave.calculateBusinessDays(startDate, endDate, data.halfDay);

  // Verificar overlap con licencias aprobadas del mismo empleado
  const overlap = await Leave.findOne({
    tenantId,
    employeeId: data.employeeId,
    status: 'approved',
    $or: [
      { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
    ]
  });

  if (overlap) {
    throw new Error('OVERLAPPING_LEAVE');
  }

  // Crear solicitud
  const leave = await Leave.create({
    tenantId,
    employeeId: data.employeeId,
    employeeName: employee.name,
    type: data.type,
    startDate,
    endDate,
    days,
    halfDay: data.halfDay || false,
    reason: data.reason,
    description: data.description,
    attachments: data.attachments || [],
    status: 'pending',
    requestedAt: new Date()
  });

  return leave;
}

/**
 * Lista licencias con filtros
 */
export async function listLeaves(
  tenantId: string,
  query: any
): Promise<{ items: LeaveDoc[]; total: number }> {
  const filter: any = { tenantId };

  if (query.employeeId) {
    filter.employeeId = query.employeeId;
  }

  if (query.type) {
    filter.type = query.type;
  }

  if (query.status) {
    filter.status = query.status;
  }

  // Filtrar por rango de fechas
  if (query.startDate || query.endDate) {
    filter.$or = [];
    if (query.startDate) {
      filter.$or.push({ startDate: { $gte: new Date(query.startDate) } });
    }
    if (query.endDate) {
      filter.$or.push({ endDate: { $lte: new Date(query.endDate) } });
    }
  }

  // Filtrar por año/mes
  if (query.year) {
    const yearStart = new Date(query.year, 0, 1);
    const yearEnd = new Date(query.year, 11, 31, 23, 59, 59);

    if (query.month) {
      const monthStart = new Date(query.year, query.month - 1, 1);
      const monthEnd = new Date(query.year, query.month, 0, 23, 59, 59);
      filter.startDate = { $lte: monthEnd };
      filter.endDate = { $gte: monthStart };
    } else {
      filter.startDate = { $lte: yearEnd };
      filter.endDate = { $gte: yearStart };
    }
  }

  const [items, total] = await Promise.all([
    Leave.find(filter)
      .sort({ startDate: -1 })
      .limit(query.limit || 50)
      .skip(query.skip || 0)
      .lean(),
    Leave.countDocuments(filter)
  ]);

  return { items: items as unknown as LeaveDoc[], total };
}

/**
 * Obtiene una licencia por ID
 */
export async function getLeaveById(
  tenantId: string,
  leaveId: string
): Promise<LeaveDoc | null> {
  const leave = await Leave.findOne({ _id: leaveId, tenantId }).lean();
  return leave as unknown as LeaveDoc | null;
}

/**
 * Actualiza una solicitud de licencia (solo si está en pending)
 */
export async function updateLeaveRequest(
  tenantId: string,
  leaveId: string,
  data: Partial<LeaveRequest>
): Promise<LeaveDoc | null> {
  const leave = await Leave.findOne({ _id: leaveId, tenantId });

  if (!leave) {
    throw new Error('LEAVE_NOT_FOUND');
  }

  if (leave.status !== 'pending') {
    throw new Error('CANNOT_UPDATE_NON_PENDING_LEAVE');
  }

  // Actualizar campos
  if (data.type) leave.type = data.type;
  if (data.startDate) leave.startDate = new Date(data.startDate);
  if (data.endDate) leave.endDate = new Date(data.endDate);
  if (data.halfDay !== undefined) leave.halfDay = data.halfDay;
  if (data.reason) leave.reason = data.reason;
  if (data.description) leave.description = data.description;
  if (data.attachments) leave.attachments = data.attachments;

  // Recalcular días si cambiaron las fechas
  if (data.startDate || data.endDate || data.halfDay !== undefined) {
    leave.days = Leave.calculateBusinessDays(leave.startDate, leave.endDate, leave.halfDay);
  }

  await leave.save();
  return leave;
}

/**
 * Aprobar o rechazar una solicitud de licencia
 */
export async function approveOrRejectLeave(
  tenantId: string,
  leaveId: string,
  approval: LeaveApproval,
  approverUserId: string,
  approverName: string
): Promise<LeaveDoc> {
  const leave = await Leave.findOne({ _id: leaveId, tenantId });

  if (!leave) {
    throw new Error('LEAVE_NOT_FOUND');
  }

  if (leave.status !== 'pending') {
    throw new Error('LEAVE_ALREADY_PROCESSED');
  }

  if (approval.approved) {
    // Aprobar
    leave.status = 'approved';
    leave.approvedBy = approverUserId;
    leave.approvedByName = approverName;
    leave.approvedAt = new Date();
  } else {
    // Rechazar
    leave.status = 'rejected';
    leave.rejectedReason = approval.reason || 'Rechazado';
    leave.approvedBy = approverUserId;
    leave.approvedByName = approverName;
    leave.approvedAt = new Date();
  }

  await leave.save();
  return leave;
}

/**
 * Cancelar una solicitud de licencia
 */
export async function cancelLeave(
  tenantId: string,
  leaveId: string,
  employeeId: string
): Promise<LeaveDoc> {
  const leave = await Leave.findOne({ _id: leaveId, tenantId, employeeId });

  if (!leave) {
    throw new Error('LEAVE_NOT_FOUND');
  }

  if (leave.status === 'approved') {
    // Solo se puede cancelar si es en el futuro
    if (leave.startDate <= new Date()) {
      throw new Error('CANNOT_CANCEL_STARTED_LEAVE');
    }
  }

  leave.status = 'cancelled';
  await leave.save();

  return leave;
}

/**
 * Eliminar una solicitud de licencia
 */
export async function deleteLeave(
  tenantId: string,
  leaveId: string
): Promise<boolean> {
  const leave = await Leave.findOne({ _id: leaveId, tenantId });

  if (!leave) {
    return false;
  }

  // Solo se pueden eliminar licencias pendientes o rechazadas
  if (leave.status !== 'pending' && leave.status !== 'rejected') {
    throw new Error('CANNOT_DELETE_APPROVED_LEAVE');
  }

  await Leave.deleteOne({ _id: leaveId });
  return true;
}

/**
 * Calcula el balance de licencias de un empleado para un año dado
 */
export async function calculateLeaveBalance(
  tenantId: string,
  employeeId: string,
  year: number
): Promise<LeaveBalance> {
  const employee = await Employee.findOne({ _id: employeeId, tenantId }).lean();

  if (!employee) {
    throw new Error('EMPLOYEE_NOT_FOUND');
  }

  // Fechas del año
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59);

  // Obtener todas las licencias del empleado en el año
  const leaves = await Leave.find({
    tenantId,
    employeeId,
    startDate: { $lte: yearEnd },
    endDate: { $gte: yearStart }
  }).lean();

  // Calcular días de vacaciones según antigüedad (Argentina)
  // 14 días hasta 5 años, 21 días de 5 a 10 años, 28 días de 10 a 20 años, 35 días más de 20 años
  let vacationDaysPerYear = 14; // Default

  if (employee.hireDate) {
    const yearsOfService = Math.floor(
      (new Date(year, 11, 31).getTime() - new Date(employee.hireDate).getTime()) /
      (1000 * 60 * 60 * 24 * 365.25)
    );

    if (yearsOfService >= 20) {
      vacationDaysPerYear = 35;
    } else if (yearsOfService >= 10) {
      vacationDaysPerYear = 28;
    } else if (yearsOfService >= 5) {
      vacationDaysPerYear = 21;
    }
  }

  // Contadores
  const vacationUsed = leaves
    .filter(l => l.type === 'vacation' && l.status === 'approved')
    .reduce((sum, l) => sum + l.days, 0);

  const vacationPending = leaves
    .filter(l => l.type === 'vacation' && l.status === 'pending')
    .reduce((sum, l) => sum + l.days, 0);

  const sickUsed = leaves
    .filter(l => l.type === 'sick' && l.status === 'approved')
    .reduce((sum, l) => sum + l.days, 0);

  const sickPending = leaves
    .filter(l => l.type === 'sick' && l.status === 'pending')
    .reduce((sum, l) => sum + l.days, 0);

  const otherUsed = leaves
    .filter(l => !['vacation', 'sick'].includes(l.type) && l.status === 'approved')
    .reduce((sum, l) => sum + l.days, 0);

  const otherPending = leaves
    .filter(l => !['vacation', 'sick'].includes(l.type) && l.status === 'pending')
    .reduce((sum, l) => sum + l.days, 0);

  return {
    employeeId,
    employeeName: employee.name,
    year,
    vacation: {
      total: vacationDaysPerYear,
      used: vacationUsed,
      pending: vacationPending,
      available: vacationDaysPerYear - vacationUsed - vacationPending
    },
    sick: {
      used: sickUsed,
      pending: sickPending
    },
    other: {
      used: otherUsed,
      pending: otherPending
    }
  };
}
