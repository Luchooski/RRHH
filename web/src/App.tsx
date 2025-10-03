// src/App.tsx
import { NavLink, Outlet } from 'react-router-dom';

export default function App() {
  return (
    <div className="min-h-dvh grid grid-cols-1 md:grid-cols-[240px_1fr]">
      <aside className="border-b md:border-b-0 md:border-r p-4 space-y-3">
        <h1 className="text-lg font-semibold">RRHH</h1>
        <nav className="grid gap-2 text-sm">
          <NavItem to="/">Dashboard</NavItem>
          <NavItem to="/candidatos">Candidatos</NavItem>
          <NavItem to="/entrevistas">Entrevistas</NavItem>
          <NavItem to="/cargar-cv">Cargar CV</NavItem>
          <NavItem to="/empleados">Empleados</NavItem>
          <NavItem to="/liquidaciones">Liquidaciones</NavItem>
          <NavItem to="/horarios">Horarios</NavItem>
          <NavItem to="/historial">Historial</NavItem>
        </nav>
      </aside>
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'rounded-md px-3 py-2 hover:bg-[--gray-3] focus-visible:outline-2',
          isActive ? 'bg-[--gray-3] font-medium' : 'text-[--gray-12]'
        ].join(' ')
      }
      aria-label={`Ir a ${typeof children === 'string' ? children : 'sección'}`}
    >
      {children}
    </NavLink>
  );
}
