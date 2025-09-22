import { useState } from 'react';

export default function UploadCVPage() {
  const [file, setFile] = useState<File | null>(null);
  const [full, setFull] = useState({ nombre:'', apellido:'', email:'', telefono:'', nacimiento:'' });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Cargar CV</h1>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <div className="card p-4 sm:p-6">
          <h3 className="text-sm font-semibold mb-3">Acceso rápido</h3>
          <label className="block border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5">
            <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e)=>setFile(e.target.files?.[0] ?? null)} />
            <div className="text-sm sm:text-base font-medium">Arrastrá un archivo o tocá aquí</div>
            <div className="text-xs text-zinc-500 mt-2">{file ? file.name : 'PDF / DOC / DOCX'}</div>
          </label>
          <button className="btn btn-primary mt-4 touch-target w-full sm:w-auto" onClick={()=>alert(file ? `Subido: ${file.name}` : 'Selecciona un archivo')}>Subir</button>
        </div>

        <form className="card p-4 sm:p-6" onSubmit={(e)=>{e.preventDefault(); alert('Formulario enviado (mock)');}}>
          <h3 className="text-sm font-semibold mb-3">Formulario completo</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <input className="btn" placeholder="Nombre" value={full.nombre} onChange={(e)=>setFull({...full,nombre:e.target.value})}/>
            <input className="btn" placeholder="Apellido" value={full.apellido} onChange={(e)=>setFull({...full,apellido:e.target.value})}/>
            <input className="btn sm:col-span-2" placeholder="Correo electrónico" type="email" value={full.email} onChange={(e)=>setFull({...full,email:e.target.value})}/>
            <input className="btn" placeholder="Teléfono" value={full.telefono} onChange={(e)=>setFull({...full,telefono:e.target.value})}/>
            <input className="btn" placeholder="Fecha de nacimiento" value={full.nacimiento} onChange={(e)=>setFull({...full,nacimiento:e.target.value})}/>
          </div>
          <button className="btn btn-primary mt-4 touch-target w-full sm:w-auto">Enviar</button>
        </form>
      </section>
    </div>
  );
}
