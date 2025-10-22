import React, { useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from './auth';
import { z } from 'zod';

const LoginSchema=z.object({
  email:z.string().trim().email('Email inválido'),
  password:z.string().min(6,'La contraseña debe tener al menos 6 caracteres'),
});

export default function LoginPage(){
  const { login }=useAuth(); const { push }=useToast(); const navigate=useNavigate(); const loc=useLocation() as any;
  const [submitting,setSubmitting]=useState(false); const emailRef=useRef<HTMLInputElement>(null);
  const [errors,setErrors]=useState<{email?:string;password?:string}>({});

  async function onSubmit(e:React.FormEvent){
    e.preventDefault(); if(submitting) return; setSubmitting(true); setErrors({});
    const f=e.target as HTMLFormElement; const d=new FormData(f);
    const raw={ email:String(d.get('email')||''), password:String(d.get('password')||'') };
    const parsed=LoginSchema.safeParse(raw);
    if(!parsed.success){
      const fe:typeof errors={}; for(const iss of parsed.error.issues){ fe[iss.path[0] as 'email'|'password']=iss.message; }
      setErrors(fe); emailRef.current?.focus(); setSubmitting(false); return;
    }
    try{
      await login(parsed.data.email,parsed.data.password);
      push({kind:'success',title:'¡Bienvenido!',message:'Ingreso correcto.'});
      const to=(loc.state?.from as string)||'/'; navigate(to,{replace:true});
    }catch(err:any){
      push({kind:'error',title:'Error de autenticación',message: err?.message?.toString?.() ?? 'No se pudo iniciar sesión.'});
      emailRef.current?.focus();
    }finally{ setSubmitting(false); }
  }

  return (
    <div className="mx-auto max-w-md p-4">
      <h1 className="text-2xl font-semibold mb-4">Ingresar</h1>
      <form onSubmit={onSubmit} aria-busy={submitting} className="space-y-3" noValidate>
        <label className="block">
          <span className="mb-1 block">Email</span>
          <input ref={emailRef} name="email" type="email" required className="w-full rounded-xl border p-2"
            autoComplete="username" aria-invalid={!!errors.email} aria-describedby={errors.email?'err-email':undefined}/>
          {errors.email && <p id="err-email" className="mt-1 text-sm text-rose-600">{errors.email}</p>}
        </label>
        <label className="block">
          <span className="mb-1 block">Contraseña</span>
          <input name="password" type="password" required className="w-full rounded-xl border p-2"
            autoComplete="current-password" aria-invalid={!!errors.password} aria-describedby={errors.password?'err-password':undefined}/>
          {errors.password && <p id="err-password" className="mt-1 text-sm text-rose-600">{errors.password}</p>}
        </label>
        <button type="submit" disabled={submitting} aria-disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 shadow-sm disabled:opacity-60">
          {submitting && <Spinner label="Iniciando sesión…" />} <span>{submitting?'Ingresando…':'Ingresar'}</span>
        </button>
      </form>
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          ¿No tienes una cuenta?{' '}
          <a href="/register" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
            Registra tu empresa
          </a>
        </p>
      </div>
    </div>
  );
}
