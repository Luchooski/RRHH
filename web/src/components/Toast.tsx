import { useEffect, useState } from 'react';

export default function Toast({ message }: { message?: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => { if (message) { setShow(true); const t = setTimeout(()=>setShow(false), 1800); return () => clearTimeout(t); } }, [message]);
  if (!show || !message) return null;
  return (
    <div aria-live="polite" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[120]">
      <div className="btn btn-primary shadow-lg">{message}</div>
    </div>
  );
}
