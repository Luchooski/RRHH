import { useEffect, useRef, useState } from 'react';

export default function KebabMenu({
  items
}: {
  items: { label: string; onClick: () => void; danger?: boolean }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button className="btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(v => !v)}>
        ⋯
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 min-w-36 card p-1 z-50">
          {items.map((it, i) => (
            <button
              key={i}
              role="menuitem"
              className={`w-full text-left btn ${it.danger ? 'text-red-600' : ''}`}
              onClick={() => {
                setOpen(false);
                it.onClick();
              }}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
