export type IStatus = 'Programada' | 'Completada' | 'Cancelada' | 'Pendiente';
export const interviews = [
  { id: 'i1', name: 'Laura Gómez', datetime: '2025-04-16T10:00:00Z', status: 'Programada' as IStatus },
  { id: 'i2', name: 'Carlos Ruiz', datetime: '2025-04-17T14:30:00Z', status: 'Completada' as IStatus },
  { id: 'i3', name: 'Ana Martínez', datetime: '2025-04-18T12:15:00Z', status: 'Cancelada' as IStatus },
  { id: 'i4', name: 'David Herrera', datetime: '2025-04-19T11:00:00Z', status: 'Pendiente'  as IStatus }
];
