import { type ReactNode, useCallback, useId, useRef, useState } from 'react';
import Modal from './Modal';
import { Button } from './Button';
import { AlertTriangle, Info } from 'lucide-react';

type Options = {
  title?: string;
  message?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  tone?: 'danger' | 'primary' | 'default' | 'info';
};

export function ConfirmDialogController() {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<Options>({});
  const titleId = useId();
  const resolver = useRef<((v: boolean) => void) | null>(null);

  (window as any).__openConfirm = (o: Options) =>
    new Promise<boolean>((res) => {
      resolver.current = res;
      setOpts(o || {});
      setOpen(true);
    });

  const close = useCallback((v: boolean) => {
    setOpen(false);
    resolver.current?.(v);
  }, []);

  const isDanger = opts.tone === 'danger';
  const isInfo   = opts.tone === 'info';

  return (
    <Modal open={open} onClose={() => close(false)} labelledById={titleId}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4">
        <div
          className={[
            'inline-flex h-9 w-9 items-center justify-center rounded-full ring-1',
            isDanger
              ? 'bg-red-600/15 text-red-400 ring-red-500/30'
              : isInfo
              ? 'bg-blue-600/15 text-blue-400 ring-blue-500/30'
              : 'bg-zinc-500/10 text-zinc-300 ring-zinc-400/30',
          ].join(' ')}
          aria-hidden
        >
          {isDanger ? <AlertTriangle size={18}/> : <Info size={18}/>}
        </div>
        <h3 id={titleId} className="text-lg font-semibold">
          {opts.title ?? (isDanger ? 'Confirmar acción destructiva' : 'Confirmar acción')}
        </h3>
      </div>

      {/* Body */}
      <div className="px-4 pb-4 pt-2">
        <p className="text-sm opacity-90">
          {opts.message ?? '¿Estás seguro? Esta acción no se puede deshacer.'}
        </p>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={() => close(false)} autoFocus>
          {opts.cancelText ?? 'Cancelar'}
        </Button>
        <Button
          variant={isDanger ? 'danger' : opts.tone === 'primary' ? 'primary' : 'default'}
          onClick={() => close(true)}
        >
          {opts.confirmText ?? (isDanger ? 'Eliminar' : 'Confirmar')}
        </Button>
      </div>
    </Modal>
  );
}

export function useConfirm() {
  return (opts?: Options) => (window as any).__openConfirm?.(opts ?? {}) as Promise<boolean>;
}
