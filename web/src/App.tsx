import { Outlet, NavLink } from 'react-router-dom';

export default function App() {
  return (
    <div className="min-h-dvh grid grid-cols-[240px_1fr]">
      <aside className="p-4 border-r border-[--color-border] dark:border-zinc-800">
        <div className="px-2 pb-3 text-lg font-semibold">Match-Hire</div>
        <nav className="flex flex-col gap-1">
          <NavLink to="/candidatos" className="btn">Candidatos</NavLink>
        </nav>
      </aside>
      <main><Outlet /></main>
    </div>
  );
}
