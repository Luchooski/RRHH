import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import Portal from './Portal';

type ToastKind = 'success' | 'error' | 'info';
type ToastItem = { id: string; title?: string; message?: string; kind: ToastKind; ttl: number };

type Ctx = {
  push: (t: Omit<ToastItem, 'id'> | string) => void;
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
};

const ToastCtx = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const push = useCallback((t: Omit<ToastItem, 'id'> | string) => {
    const item: ToastItem = typeof t === 'string'
      ? { id: String(++idRef.current), message: t, kind: 'info', ttl: 3500 }
      : { id: String(++idRef.current), ...t };
    setItems(prev => [...prev, item]);
    // autocierre
    setTimeout(() => remove(item.id), item.ttl);
  }, [remove]);

  const api = useMemo<Ctx>(() => ({
    push,
    success: (m: string) => push({ kind: 'success', message: m, ttl: 3000 }),
    error:   (m: string) => push({ kind: 'error', message: m, ttl: 4500 }),
    info:    (m: string) => push({ kind: 'info', message: m, ttl: 3500 }),
  }), [push]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <Portal id="toast-viewport">
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 z-[999] flex flex-col gap-2"
        >
          {items.map(t => (
            <div
              key={t.id}
              className={[
                'min-w-[240px] max-w-[360px] rounded-xl px-3 py-2 text-sm shadow-lg ring-1',
                'bg-[--color-card] text-[--color-fg] ring-[--color-border]',
                t.kind === 'success' ? 'border-l-4 border-l-emerald-500' : '',
                t.kind === 'error'   ? 'border-l-4 border-l-red-500'     : '',
                t.kind === 'info'    ? 'border-l-4 border-l-blue-500'    : '',
              ].join(' ')}
            >
              {t.title ? <div className="font-semibold mb-0.5">{t.title}</div> : null}
              <div className="opacity-90">{t.message}</div>
            </div>
          ))}
        </div>
      </Portal>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}
