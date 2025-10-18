import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Fragment } from 'react';

interface BreadcrumbItem {
  label: string;
  path: string;
}

const ROUTE_LABELS: Record<string, string> = {
  candidatos: 'Candidatos',
  entrevistas: 'Entrevistas',
  agenda: 'Agenda',
  vacantes: 'Vacantes',
  clientes: 'Clientes',
  empleados: 'Empleados',
  liquidaciones: 'Liquidaciones',
  horarios: 'Horarios',
  reportes: 'Reportes',
  historial: 'Historial',
  'cargar-cv': 'Cargar CV',
  nuevo: 'Nuevo',
  nuevos: 'Nuevo',
  editar: 'Editar',
  pipeline: 'Pipeline',
};

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  let currentPath = '';
  paths.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Si es un ID (formato MongoDB o UUID), usar el label anterior + "Detalle"
    const isId = /^[a-f0-9]{24}$|^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
    
    if (isId) {
      const prevLabel = breadcrumbs[breadcrumbs.length - 1]?.label || 'Elemento';
      breadcrumbs.push({
        label: 'Detalle',
        path: currentPath,
      });
    } else {
      breadcrumbs.push({
        label: ROUTE_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
        path: currentPath,
      });
    }
  });

  return breadcrumbs;
}

export default function Breadcrumbs() {
  const location = useLocation();
  const breadcrumbs = generateBreadcrumbs(location.pathname);

  // No mostrar breadcrumbs en la home
  if (location.pathname === '/') {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-1 text-sm">
      <Link
        to="/"
        className="flex items-center gap-1 text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        aria-label="Inicio"
      >
        <Home size={16} />
        <span className="hidden sm:inline">Inicio</span>
      </Link>

      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;

        return (
          <Fragment key={crumb.path}>
            <ChevronRight size={16} className="text-gray-400" aria-hidden="true" />
            {isLast ? (
              <span
                className="font-medium text-gray-900 dark:text-gray-100"
                aria-current="page"
              >
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.path}
                className="text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                {crumb.label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
