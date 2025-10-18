import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  push: (toast: Omit<Toast, 'id'>) => void;
  remove: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    
    setToasts((prev) => [...prev, newToast]);

    if (toast.duration !== 0) {
      setTimeout(() => {
        remove(id);
      }, toast.duration || 3000);
    }
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, push, remove }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return createPortal(
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>,
    document.body
  );
}

const TOAST_CONFIG = {
  success: { icon: CheckCircle, className: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900' },
  error: { icon: XCircle, className: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900' },
  info: { icon: Info, className: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900' },
  warning: { icon: AlertTriangle, className: 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-900' },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const config = TOAST_CONFIG[toast.type];
  const Icon = config.icon;

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-4 shadow-lg animate-in slide-in-from-right-full duration-300 ${config.className}`}
      role="alert"
    >
      <Icon size={20} className="shrink-0" />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 rounded-lg p-1 hover:bg-black/10 dark:hover:bg-white/10"
        aria-label="Cerrar notificación"
      >
        <X size={16} />
      </button>
    </div>
  );
}