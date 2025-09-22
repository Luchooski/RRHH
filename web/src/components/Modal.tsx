export default function Modal({ open, onClose, title, children }:{
  open:boolean; onClose:()=>void; title:string; children:React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal className="fixed inset-0 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <section className="relative card w-[520px] max-w-[90vw] p-4">
        <header className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button className="btn" onClick={onClose}>Cerrar</button>
        </header>
        {children}
      </section>
    </div>
  );
}
