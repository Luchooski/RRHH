import { useEffect } from 'react';

export default function Drawer({
  open,
  onClose,
  title,
  children
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  // Cerrar con ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-[100] ${open ? '' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      {/* Overlay por ENCIMA del topbar */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`absolute right-0 top-0 h-full w-[420px] max-w-[90vw] card p-4
          shadow-xl transition-transform will-change-transform
          ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <header className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button className="btn" onClick={onClose}>Cerrar</button>
        </header>
        <div className="overflow-auto h-[calc(100%-56px)]">{children}</div>
      </aside>
    </div>
  );
}
