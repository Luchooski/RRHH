import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
type ToastKind='success'|'error'|'info';
export type ToastItem={id:string;kind:ToastKind;title?:string;message:string;ttlMs?:number};
type ToastCtx={toasts:ToastItem[];push:(t:Omit<ToastItem,'id'>)=>void;remove:(id:string)=>void;clear:()=>void};
const Ctx=createContext<ToastCtx|null>(null);

export function ToastProvider({ children }:{ children:React.ReactNode }) {
  const [toasts,setToasts]=useState<ToastItem[]>([]);
  const remove=useCallback((id:string)=>setToasts(xs=>xs.filter(t=>t.id!==id)),[]);
  const push:ToastCtx['push']=useCallback((t)=>{
    const id=crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    const ttl=t.ttlMs ?? 3500;
    setToasts(xs=>[...xs,{...t,id}].slice(-3));
    window.setTimeout(()=>remove(id),ttl);
  },[remove]);
  const clear=useCallback(()=>setToasts([]),[]);
  const value=useMemo(()=>({toasts,push,remove,clear}),[toasts,push,remove,clear]);

  return <>
    <Ctx.Provider value={value}>{children}</Ctx.Provider>
    <div aria-live="polite" aria-atomic="true" className="pointer-events-none fixed inset-x-0 top-2 z-50 flex flex-col items-center gap-2 px-2">
      {toasts.map(t=>(
        <div key={t.id} role="status"
          className={[
            'pointer-events-auto w-full max-w-sm rounded-2xl p-3 shadow-lg text-sm',
            t.kind==='success'&&'bg-emerald-50 text-emerald-900 border border-emerald-200',
            t.kind==='error'  &&'bg-rose-50 text-rose-900 border border-rose-200',
            t.kind==='info'   &&'bg-slate-50 text-slate-900 border border-slate-200'
          ].filter(Boolean).join(' ')}
        >
          {t.title && <div className="font-medium mb-0.5">{t.title}</div>}
          <div>{t.message}</div>
        </div>
      ))}
    </div>
  </>;
}
export function useToast(){ const ctx=useContext(Ctx); if(!ctx) throw new Error('useToast must be used within <ToastProvider>'); return ctx; }
