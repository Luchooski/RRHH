import { X, Clock, Trash2, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';

interface HistoryItem {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  user: string;
  timestamp: Date;
  details?: string;
}

interface HistoryDrawerProps {
  open: boolean;
  onClose: () => void;
}

// Simulación de datos (reemplazar con tu API real)
function useHistoryData() {
  const [items, setItems] = useState<HistoryItem[]>([
    {
      id: '1',
      action: 'Creó',
      entity: 'Candidato',
      entityId: '123',
      user: 'Juan Pérez',
      timestamp: new Date(),
      details: 'María González',
    },
    {
      id: '2',
      action: 'Actualizó',
      entity: 'Vacante',
      entityId: '456',
      user: 'Ana Martínez',
      timestamp: new Date(Date.now() - 3600000),
      details: 'Frontend Developer',
    },
    {
      id: '3',
      action: 'Eliminó',
      entity: 'Entrevista',
      user: 'Carlos Rodríguez',
      timestamp: new Date(Date.now() - 7200000),
    },
  ]);

  const clearHistory = () => {
    if (confirm('¿Estás seguro de limpiar todo el historial?')) {
      setItems([]);
    }
  };

  return { items, clearHistory };
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `Hace ${days} día${days > 1 ? 's' : ''}`;
  if (hours > 0) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
  return 'Hace un momento';
}

export default function HistoryDrawer({ open, onClose }: HistoryDrawerProps) {
  const { items, clearHistory } = useHistoryData();

  // Cerrar con ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  // Prevenir scroll del body cuando está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full transform flex-col bg-white shadow-2xl transition-transform duration-300 dark:bg-gray-900 sm:w-96 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h2 id="history-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Historial
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Cerrar historial"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Calendar className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-700" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No hay actividad reciente
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        <span className="text-indigo-600 dark:text-indigo-400">{item.user}</span>
                        {' '}{item.action.toLowerCase()}{' '}
                        <span className="font-semibold">{item.entity.toLowerCase()}</span>
                      </p>
                      {item.details && (
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {item.details}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {formatRelativeTime(item.timestamp)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-800">
            <button
              onClick={clearHistory}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Trash2 size={16} />
              Limpiar historial
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
