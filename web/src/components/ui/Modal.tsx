import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Portal from './Portal';

function getFocusable(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
  ).filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
}

export default function Modal({
  open, onClose, children, labelledById,
}:{
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledById?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Bloquear scroll del body
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Fade-in en el primer tick
  useLayoutEffect(() => {
    if (open) requestAnimationFrame(() => setVisible(true));
    else setVisible(false);
  }, [open]);

  // ESC para cerrar
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Focus trap
  useEffect(() => {
    if (!open || !panelRef.current) return;
    const panel = panelRef.current;
    const focusables = getFocusable(panel);
    (focusables[0] ?? panel).focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const items = getFocusable(panel);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    };
    panel.addEventListener('keydown', onKeyDown as any);
    return () => panel.removeEventListener('keydown', onKeyDown as any);
  }, [open]);

  if (!open) return null;

  return (
    <Portal id="modal-root">
      <div
        className="fixed inset-0 z-[1000] flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledById}
      >
        {/* Overlay */}
        <div
          className={[
            'absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity',
            visible ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
          onClick={onClose}
        />
        {/* Panel */}
        <div
          ref={panelRef}
          className={[
            'relative z-[1001] w-[min(92vw,520px)] rounded-2xl',
            'bg-[--color-bg] text-[--color-fg] shadow-2xl ring-1 ring-[--color-border]',
            'transition-all duration-150',
            visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
            'focus:outline-none',
          ].join(' ')}
          tabIndex={-1}
        >
          {children}
        </div>
      </div>
    </Portal>
  );
}
