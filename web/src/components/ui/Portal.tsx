import {type ReactNode, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

export default function Portal({ children, id = 'portal-root' }:{ children: ReactNode; id?: string }) {
  const root = useMemo(() => {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      document.body.appendChild(el);
    }
    return el;
  }, [id]);

  useEffect(() => {
    return () => {
      // no removemos el nodo para reutilizarlo entre portales
    };
  }, []);

  return createPortal(children, root);
}
