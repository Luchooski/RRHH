import InfoItem from '../../components/InfoItem';
import { employees } from '../../mock/employees';

export default function EmployeesPage() {
  const e = employees[0];
  return (
    <div className="section space-y-4">
      <h1 className="text-xl sm:text-2xl font-semibold">Empleados</h1>

      <section className="card p-4 sm:p-6 space-y-4">
        {/* Encabezado */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">{e.name}</h2>
          <div className="text-[--color-muted]">{e.role}</div>
        </div>

        {/* Datos: 1 col → 2 cols */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoItem label="ID de empleado" value="123456" />
          <InfoItem label="Correo" value={e.email} href={`mailto:${e.email}`} />
          <InfoItem label="Teléfono" value="+54 9 11 2345-6789" href="tel:+5491123456789" />
          <InfoItem label="Puesto" value={e.role} />
          <InfoItem label="Horas mensuales" value={String(e.monthlyHours)} />
        </div>

        {/* Acciones: iguales y accesibles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 pb-[env(safe-area-inset-bottom,0)]">
          <a
            href="/horarios"
            className="btn btn-primary touch-target w-full text-center "
            aria-label="Ver horarios del empleado"
          >
            Ver horarios
          </a>
          <a
            href="/liquidaciones"
            className="btn touch-target w-full text-center "
            aria-label="Ver liquidaciones del empleado"
          >
            Ver liquidaciones
          </a>
        </div>
      </section>
    </div>
  );
}
