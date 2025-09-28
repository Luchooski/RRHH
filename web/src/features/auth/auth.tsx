import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { setToken, setOnUnauthorized } from '../../lib/http';
import { AuthApi } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';

type User = { id: string; email: string; role: string };

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);
const KEY_USER = 'auth_user';

export function AuthProvider({ children }:{children:React.ReactNode}) {
  const [user,setUser]=useState<User|null>(()=>{try{const raw=localStorage.getItem(KEY_USER);return raw?JSON.parse(raw) as User:null;}catch{return null;}});
  const [loading,setLoading]=useState(true);
  const { push }=useToast();

  useEffect(()=>{ setOnUnauthorized(()=>{ setToken(null); setUser(null); localStorage.removeItem(KEY_USER); }); return()=>setOnUnauthorized(null); },[]);
  useEffect(()=>{ (async()=>{ try{ const me=await AuthApi.me(); setUser(me);}catch{ setUser(null);}finally{ setLoading(false);} })(); },[]);

  const value=useMemo<AuthCtx>(()=>({
    user, loading,
    async login(email,password){ const res=await AuthApi.login(email,password); setToken(res.token); setUser(res.user); localStorage.setItem(KEY_USER,JSON.stringify(res.user)); },
    async logout(){ try{ await AuthApi.logout(); }catch{} finally{ setToken(null); setUser(null); localStorage.removeItem(KEY_USER); push({kind:'info',message:'Sesión cerrada.'}); } },
  }),[user,loading,push]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(){ 
  const ctx=useContext(Ctx); 
  if(!ctx) throw new Error('useAuth must be used within AuthProvider');
   return ctx; 
  }