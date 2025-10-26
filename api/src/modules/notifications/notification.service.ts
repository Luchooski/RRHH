import {
  getNotificationModel,
  type INotification,
  type NotificationType,
  type NotificationChannel,
  type NotificationPriority,
} from './notification.model.js';
import { Types } from 'mongoose';

/** ========= Tipos auxiliares sin `any` ========= **/

// Variables permitidas en las plantillas
type TemplateVars = Record<string, string | number | boolean | Date>;

// Documento lean (lo que retorna .lean()) tipado a mano
type NotificationLean = INotification & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  readAt?: Date;
};

// DTO interno para crear notificaciones
type CreateNotificationDTO = {
  tenantId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  channels: NotificationChannel[];
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  category: string;
  actionUrl?: string;
  actionLabel?: string;
  data?: Record<string, unknown>;
  sentAt?: Date;
  emailSent?: boolean;
  emailSentAt?: Date;
  pushSent?: boolean;
  pushSentAt?: Date;
};

/** ========= Templates ========= **/

export const NOTIFICATION_TEMPLATES = {
  LEAVE_REQUESTED: {
    title: 'Nueva Solicitud de Licencia',
    message:
      '{{employeeName}} ha solicitado una licencia de tipo {{leaveType}} del {{startDate}} al {{endDate}}.',
    category: 'leave',
    type: 'info' as NotificationType,
    priority: 'normal' as NotificationPriority,
    actionLabel: 'Ver Solicitud',
  },
  LEAVE_APPROVED: {
    title: 'Licencia Aprobada',
    message:
      'Tu solicitud de licencia del {{startDate}} al {{endDate}} ha sido aprobada por {{approverName}}.',
    category: 'leave',
    type: 'success' as NotificationType,
    priority: 'high' as NotificationPriority,
    actionLabel: 'Ver Detalles',
  },
  LEAVE_REJECTED: {
    title: 'Licencia Rechazada',
    message:
      'Tu solicitud de licencia del {{startDate}} al {{endDate}} ha sido rechazada. Motivo: {{reason}}',
    category: 'leave',
    type: 'warning' as NotificationType,
    priority: 'high' as NotificationPriority,
    actionLabel: 'Ver Detalles',
  },
  EVALUATION_ASSIGNED: {
    title: 'Nueva Evaluación Asignada',
    message:
      'Se te ha asignado una evaluación de desempeño para {{employeeName}}. Fecha límite: {{dueDate}}',
    category: 'evaluation',
    type: 'info' as NotificationType,
    priority: 'high' as NotificationPriority,
    actionLabel: 'Completar Evaluación',
  },
  EVALUATION_SUBMITTED: {
    title: 'Evaluación Enviada',
    message: '{{evaluatorName}} ha completado tu evaluación de desempeño.',
    category: 'evaluation',
    type: 'info' as NotificationType,
    priority: 'normal' as NotificationPriority,
    actionLabel: 'Ver Resultados',
  },
  EVALUATION_DUE_SOON: {
    title: 'Evaluación Próxima a Vencer',
    message: 'La evaluación de {{employeeName}} vence en {{daysLeft}} días.',
    category: 'evaluation',
    type: 'warning' as NotificationType,
    priority: 'high' as NotificationPriority,
    actionLabel: 'Completar Ahora',
  },
  EVALUATION_APPROVED: {
    title: 'Evaluación Aprobada',
    message:
      'Tu evaluación de desempeño ha sido aprobada por {{approverName}}. Puntuación final: {{score}}',
    category: 'evaluation',
    type: 'success' as NotificationType,
    priority: 'high' as NotificationPriority,
    actionLabel: 'Ver Resultados',
  },
  ATTENDANCE_MISSING: {
    title: 'Registro de Asistencia Pendiente',
    message:
      'No has registrado tu asistencia el día {{date}}. Por favor, completa tu registro.',
    category: 'attendance',
    type: 'warning' as NotificationType,
    priority: 'normal' as NotificationPriority,
    actionLabel: 'Registrar Asistencia',
  },
  ATTENDANCE_LATE: {
    title: 'Llegada Tarde Registrada',
    message: 'Se ha registrado una llegada tarde el {{date}} a las {{time}}.',
    category: 'attendance',
    type: 'info' as NotificationType,
    priority: 'low' as NotificationPriority,
  },
  BENEFIT_ENROLLED: {
    title: 'Inscripción en Beneficio Confirmada',
    message: 'Tu inscripción en el beneficio "{{benefitName}}" ha sido confirmada.',
    category: 'benefit',
    type: 'success' as NotificationType,
    priority: 'normal' as NotificationPriority,
    actionLabel: 'Ver Beneficios',
  },
  BENEFIT_EXPIRING: {
    title: 'Beneficio Próximo a Expirar',
    message: 'Tu beneficio "{{benefitName}}" expirará el {{expiryDate}}.',
    category: 'benefit',
    type: 'warning' as NotificationType,
    priority: 'normal' as NotificationPriority,
    actionLabel: 'Renovar',
  },
  PAYROLL_GENERATED: {
    title: 'Recibo de Sueldo Disponible',
    message: 'Tu recibo de sueldo del período {{period}} está disponible.',
    category: 'payroll',
    type: 'info' as NotificationType,
    priority: 'high' as NotificationPriority,
    actionLabel: 'Ver Recibo',
  },
  SYSTEM_ANNOUNCEMENT: {
    title: '{{title}}',
    message: '{{message}}',
    category: 'system',
    type: 'info' as NotificationType,
    priority: 'normal' as NotificationPriority,
  },
  WORKFLOW_STEP_ASSIGNED: {
    title: 'Nueva Tarea Asignada',
    message:
      'Se te ha asignado la tarea "{{stepName}}" en el proceso "{{workflowName}}".',
    category: 'workflow',
    type: 'info' as NotificationType,
    priority: 'high' as NotificationPriority,
    actionLabel: 'Ver Tarea',
  },
  WORKFLOW_COMPLETED: {
    title: 'Proceso Completado',
    message: 'El proceso "{{workflowName}}" ha sido completado exitosamente.',
    category: 'workflow',
    type: 'success' as NotificationType,
    priority: 'normal' as NotificationPriority,
  },
  WORKFLOW_REJECTED: {
    title: 'Proceso Rechazado',
    message:
      'El proceso "{{workflowName}}" ha sido rechazado en el paso "{{stepName}}". Motivo: {{reason}}',
    category: 'workflow',
    type: 'warning' as NotificationType,
    priority: 'high' as NotificationPriority,
  },
} as const;

/** ========= Helpers ========= **/

function replaceVariables(template: string, variables: TemplateVars): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const v =
      value instanceof Date
        ? value.toISOString()
        : typeof value === 'boolean'
        ? String(value)
        : String(value);
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), v);
  }
  return result;
}

/** ========= Services ========= **/

type CreateNotificationParams = {
  tenantId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  templateKey?: keyof typeof NOTIFICATION_TEMPLATES;
  title?: string;
  message?: string;
  type?: NotificationType;
  channels?: NotificationChannel[];
  priority?: NotificationPriority;
  category?: string;
  actionUrl?: string;
  actionLabel?: string;
  data?: Record<string, unknown>;
  variables?: TemplateVars;
};

export async function createNotification(
  params: CreateNotificationParams,
): Promise<INotification> {
  const {
    tenantId,
    userId,
    userName,
    userEmail,
    templateKey,
    title,
    message,
    type,
    channels = ['in-app'],
    priority,
    category,
    actionUrl,
    actionLabel,
    data,
    variables = {},
  } = params;

  let notificationData: CreateNotificationDTO = {
    tenantId,
    userId,
    userName,
    userEmail,
    channels,
    title: '',
    message: '',
    type: (type ?? 'info') as NotificationType,
    priority: (priority ?? 'normal') as NotificationPriority,
    category: category ?? 'system',
  };

  if (templateKey && NOTIFICATION_TEMPLATES[templateKey]) {
    const template = NOTIFICATION_TEMPLATES[templateKey];
    notificationData = {
      ...notificationData,
      title: replaceVariables(template.title, variables),
      message: replaceVariables(template.message, variables),
      type: template.type,
      priority: template.priority,
      category: template.category,
      actionLabel: (template as { actionLabel?: string }).actionLabel,
    };
  }

  if (title) notificationData.title = title;
  if (message) notificationData.message = message;
  if (type) notificationData.type = type;
  if (priority) notificationData.priority = priority;
  if (category) notificationData.category = category;
  if (actionUrl) notificationData.actionUrl = actionUrl;
  if (actionLabel) notificationData.actionLabel = actionLabel;
  if (data) notificationData.data = data;

  notificationData.sentAt = new Date();

  const Notification = getNotificationModel();
  const notification = await Notification.create(notificationData);

  if (channels.includes('email') && userEmail) {
    notification.emailSent = true;
    notification.emailSentAt = new Date();
  }
  if (channels.includes('push')) {
    notification.pushSent = true;
    notification.pushSentAt = new Date();
  }

  await notification.save();
  return notification.toObject() as INotification;
}

export async function getUserNotifications(params: {
  tenantId: string;
  userId: string;
  isRead?: boolean;
  category?: string;
  limit?: number;
  skip?: number;
}): Promise<{ notifications: NotificationLean[]; total: number; limit: number; skip: number }> {
  const { tenantId, userId, isRead, category, limit = 50, skip = 0 } = params;

  const query: Record<string, unknown> = { tenantId, userId };
  if (isRead !== undefined) (query as { isRead: boolean }).isRead = isRead;
  if (category) (query as { category: string }).category = category;

  const Notification = getNotificationModel();
  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean<NotificationLean[]>();

  const total = await Notification.countDocuments(query);

  return { notifications, total, limit, skip };
}

export async function markAsRead(params: {
  tenantId: string;
  userId: string;
  notificationId: string;
}): Promise<INotification> {
  const { tenantId, userId, notificationId } = params;
  const Notification = getNotificationModel();

  const notification = await Notification.findOne({
    _id: notificationId,
    tenantId,
    userId,
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }

  return notification.toObject() as INotification;
}

export async function markAllAsRead(params: {
  tenantId: string;
  userId: string;
}): Promise<{ success: true; modifiedCount: number }> {
  const { tenantId, userId } = params;
  const Notification = getNotificationModel();

  const result = await Notification.updateMany(
    { tenantId, userId, isRead: false },
    { isRead: true, readAt: new Date() },
  );

  return { success: true, modifiedCount: result.modifiedCount };
}

export async function deleteNotification(params: {
  tenantId: string;
  userId: string;
  notificationId: string;
}): Promise<{ success: true }> {
  const { tenantId, userId, notificationId } = params;
  const Notification = getNotificationModel();

  const result = await Notification.deleteOne({
    _id: notificationId,
    tenantId,
    userId,
  });

  if (result.deletedCount === 0) {
    throw new Error('Notification not found');
  }

  return { success: true };
}

export async function getNotificationStats(params: {
  tenantId: string;
  userId: string;
}): Promise<{ total: number; unread: number; read: number; byCategory: Record<string, number> }> {
  const { tenantId, userId } = params;
  const Notification = getNotificationModel();

  const total = await Notification.countDocuments({ tenantId, userId });
  const unread = await Notification.countDocuments({ tenantId, userId, isRead: false });
  const byCategory = await Notification.aggregate<{ _id: string; count: number }>([
    { $match: { tenantId, userId } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);

  const categoryMap: Record<string, number> = {};
  for (const item of byCategory) categoryMap[item._id] = item.count;

  return { total, unread, read: total - unread, byCategory: categoryMap };
}

export async function bulkCreateNotifications(params: {
  tenantId: string;
  users: Array<{ userId: string; userName: string; userEmail?: string }>;
  templateKey?: keyof typeof NOTIFICATION_TEMPLATES;
  title?: string;
  message?: string;
  type?: NotificationType;
  channels?: NotificationChannel[];
  priority?: NotificationPriority;
  category?: string;
  actionUrl?: string;
  actionLabel?: string;
  data?: Record<string, unknown>;
  variables?: TemplateVars;
}): Promise<{ success: true; count: number }> {
  const Notification = getNotificationModel();
  const {
    tenantId,
    users,
    templateKey,
    title,
    message,
    type,
    channels = ['in-app'],
    priority,
    category,
    actionUrl,
    actionLabel,
    data,
    variables = {},
  } = params;

  const notifications: CreateNotificationDTO[] = users.map((user) => {
    let notificationData: CreateNotificationDTO = {
      tenantId,
      userId: user.userId,
      userName: user.userName,
      userEmail: user.userEmail,
      channels,
      sentAt: new Date(),
      title: '',
      message: '',
      type: (type ?? 'info') as NotificationType,
      priority: (priority ?? 'normal') as NotificationPriority,
      category: category ?? 'system',
    };

    if (templateKey && NOTIFICATION_TEMPLATES[templateKey]) {
      const template = NOTIFICATION_TEMPLATES[templateKey];
      notificationData = {
        ...notificationData,
        title: replaceVariables(template.title, variables),
        message: replaceVariables(template.message, variables),
        type: template.type,
        priority: template.priority,
        category: template.category,
        actionLabel: (template as { actionLabel?: string }).actionLabel,
      };
    }

    if (title) notificationData.title = title;
    if (message) notificationData.message = message;
    if (type) notificationData.type = type;
    if (priority) notificationData.priority = priority;
    if (category) notificationData.category = category;
    if (actionUrl) notificationData.actionUrl = actionUrl;
    if (actionLabel) notificationData.actionLabel = actionLabel;
    if (data) notificationData.data = data;

    return notificationData;
  });

  const result = await Notification.insertMany(notifications);
  return { success: true, count: result.length };
}
