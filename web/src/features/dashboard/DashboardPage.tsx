import KPI from '../../components/KPI';
import TodoList from '../../components/TodoList';
import NotesPanel from '../../components/NotesPanel';

export default function DashboardPage() {
  return (
    <div className="section space-y-5 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-semibold">Dashboard</h1>

      {/* 1 col en xs, 2 en sm, 4 en lg */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPI label="Candidatos" value="12" />
        <KPI label="Entrevistas" value="5" />
        <KPI label="Empleados" value="30" />
        <KPI label="Liquidaciones" value="6" />
      </section>

      {/* 1 col en xs, 3 en lg */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="lg:col-span-2"><TodoList /></div>
        <NotesPanel />
      </section>
    </div>
  );
}
