# Sprint 3 - Documentación

## Resumen Ejecutivo

Sprint 3 implementa cuatro grandes funcionalidades que extienden significativamente las capacidades del sistema de RRHH:

- **Dashboard & Analytics**: Métricas y tendencias en tiempo real
- **RBAC UI**: Interfaz de gestión de roles y permisos
- **Benefits System**: Sistema completo de beneficios para empleados
- **Document Improvements**: Versionado, búsqueda avanzada y preview de documentos

---

## 1. Dashboard & Analytics

### Descripción
Sistema completo de analíticas con KPIs en tiempo real y visualizaciones interactivas que agregan datos de múltiples módulos del sistema.

### Backend

#### Endpoints

**GET /api/v1/analytics/dashboard**
- **Descripción**: Obtiene todos los KPIs del dashboard
- **Autenticación**: Requerida
- **Permisos**: `reports.read`
- **Respuesta**: Objeto con 5 categorías de métricas

```json
{
  "recruitment": {
    "totalCandidates": 150,
    "activeVacancies": 8,
    "applicationsThisMonth": 45,
    "avgTimeToHire": 21,
    "candidatesByStage": {
      "screening": 30,
      "interview_scheduled": 15,
      "hired": 5
    }
  },
  "employees": {
    "totalActive": 120,
    "newHiresThisMonth": 5,
    "newHiresThisYear": 32,
    "byDepartment": [
      { "department": "IT", "count": 45 },
      { "department": "Sales", "count": 30 }
    ]
  },
  "attendance": {
    "avgAttendanceRate": 95.5,
    "totalHoursThisMonth": 19200,
    "lateArrivals": 12,
    "earlyDepartures": 8
  },
  "leaves": {
    "pendingApproval": 5,
    "approvedThisMonth": 15,
    "rejectedThisMonth": 2,
    "byType": {
      "vacation": 10,
      "sick_leave": 5
    }
  },
  "benefits": {
    "totalMonthlyCost": 125000,
    "activeAssignments": 200,
    "costPerEmployee": 1041.67,
    "byType": {
      "health_insurance": 80,
      "meal_vouchers": 120
    }
  }
}
```

**GET /api/v1/analytics/trends/new-hires**
- **Query Params**: `months` (1-12, default: 6)
- **Respuesta**: Array de datos de serie temporal

**GET /api/v1/analytics/trends/applications**
- **Query Params**: `months` (1-12, default: 6)
- **Respuesta**: Array de datos de serie temporal

**GET /api/v1/analytics/trends/attendance**
- **Query Params**: `days` (1-365, default: 30)
- **Respuesta**: Array de datos de serie temporal

#### Agregaciones MongoDB
El servicio utiliza agregaciones paralelas de 6 colecciones:
- Candidate
- Vacancy
- Application
- Employee
- Attendance
- Leave
- EmployeeBenefit

### Frontend

#### Componentes

**DashboardPage** (`web/src/features/analytics/DashboardPage.tsx`)
- 20+ tarjetas de KPIs con gradientes e iconos
- 7 tipos de gráficos usando recharts:
  - Bar charts (candidatos por etapa, empleados por departamento)
  - Pie charts (licencias por tipo, beneficios por tipo)
  - Area charts (nuevas contrataciones, asistencia)
  - Line charts (aplicaciones)
- Filtros interactivos de rango temporal
- Auto-refresh cada 5 minutos
- Responsive y dark mode

#### Navegación
- Ruta: `/analiticas`
- Sidebar: "Analíticas" con icono TrendingUp

---

## 2. RBAC UI - Role-Based Access Control

### Descripción
Interfaz completa para gestión de roles y permisos, permitiendo crear roles personalizados con permisos granulares.

### Backend (Existente desde Sprint 2)
- 7 endpoints para gestión de roles
- 67 permisos individuales organizados en 17 módulos
- 5 roles predefinidos (admin, hr, employee, manager, recruiter)
- Soporte para roles personalizados por tenant

### Frontend

#### Componentes

**RolesManagementPage** (`web/src/features/rbac/RolesManagementPage.tsx`)

**Características:**
- Grid de roles predefinidos (solo lectura)
- Grid de roles personalizados (CRUD completo)
- Modal full-screen para crear/editar roles:
  - Formulario de nombre y descripción
  - Selector de permisos organizado por módulos
  - Checkboxes por acción individual
  - Botón "Seleccionar Todos" por módulo
  - Contador de permisos seleccionados
- Eliminación de roles personalizados con confirmación
- Protección contra eliminación de roles del sistema

**PermissionsViewerPage** (`web/src/features/rbac/PermissionsViewerPage.tsx`)

**Características:**
- Tarjeta de rol actual del usuario
- Vista especial para admin (acceso total)
- Permisos agrupados por módulo con iconos
- Checkmarks verdes para permisos otorgados
- Resumen de total de permisos

#### Permisos Disponibles

**17 Módulos:**
- candidates, employees, vacancies, interviews
- leaves, attendance, payroll, schedules
- clients, reports, settings, users, audit

**8 Acciones:**
- create, read, update, delete
- approve, manage, export, import

**Total**: 67 permisos individuales + wildcard (*)

#### Navegación
- Ruta: `/roles` (Gestión de roles)
- Ruta: `/mis-permisos` (Ver permisos del usuario)
- Sidebar: "Roles" con icono Shield

---

## 3. Benefits System

### Descripción
Sistema completo de gestión de beneficios para empleados con catálogo, asignación, elegibilidad y workflow de aprobación.

### Backend

#### Modelo de Datos

**Benefit** (Catálogo de beneficios)
```typescript
{
  tenantId: string;
  name: string;
  type: BenefitType; // 14 tipos disponibles
  description?: string;
  costToCompany: number;
  costToEmployee: number;
  frequency: 'monthly' | 'quarterly' | 'yearly' | 'one_time';
  provider?: string;
  eligibility: {
    minMonthsEmployment?: number;
    roles?: string[];
    departments?: string[];
  };
  requiresApproval: boolean;
  status: 'active' | 'inactive';
}
```

**EmployeeBenefit** (Asignaciones)
```typescript
{
  tenantId: string;
  benefitId: string;
  employeeId: string;
  status: 'pending' | 'active' | 'rejected' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  cancellationReason?: string;
  notes?: string;
}
```

#### 14 Tipos de Beneficios
- health_insurance (Seguro Médico)
- life_insurance (Seguro de Vida)
- meal_vouchers (Vales de Comida)
- transport (Transporte)
- education (Educación)
- gym (Gimnasio)
- remote_work (Trabajo Remoto)
- flexible_hours (Horario Flexible)
- bonus (Bonos)
- stock_options (Opciones de Acciones)
- vacation_extra (Días Extra de Vacaciones)
- phone (Teléfono)
- laptop (Laptop)
- other (Otro)

#### Endpoints

**Gestión de Catálogo:**
- POST /api/v1/benefits - Crear beneficio
- GET /api/v1/benefits - Listar beneficios
- GET /api/v1/benefits/:id - Obtener beneficio
- PUT /api/v1/benefits/:id - Actualizar beneficio
- DELETE /api/v1/benefits/:id - Eliminar beneficio

**Asignación y Gestión:**
- POST /api/v1/employee-benefits - Asignar beneficio a empleado
- GET /api/v1/employee-benefits - Listar asignaciones
- PUT /api/v1/employee-benefits/:id/approve - Aprobar asignación
- PUT /api/v1/employee-benefits/:id/cancel - Cancelar asignación
- GET /api/v1/employee-benefits/eligibility - Verificar elegibilidad
- GET /api/v1/employee-benefits/cost-summary - Resumen de costos

### Frontend

#### Componentes

**BenefitsManagementPage** (Admin/HR)
- Grid de tarjetas con beneficios del catálogo
- Filtros por tipo y estado
- Modal para crear/editar beneficios:
  - Información básica (nombre, tipo, descripción)
  - Costos (empresa y empleado)
  - Frecuencia de pago
  - Proveedor
  - Reglas de elegibilidad
  - Requisitos de aprobación
- Acciones: Editar, Eliminar, Ver detalles

**EmployeeBenefitsPage** (Employee Portal)
- Tarjetas de resumen (Activos, Pendientes, Costo total)
- Grid de beneficios activos
- Lista de beneficios pendientes de aprobación
- Tabla de historial
- Diseño con gradientes y visual appeal

#### Navegación
- Ruta Admin: `/beneficios`
- Ruta Employee: `/employee/benefits`
- Sidebar: "Beneficios" con icono Gift

---

## 4. Document Improvements

### Descripción
Mejoras significativas al sistema de documentos con versionado, búsqueda avanzada y preview inline.

### Backend

#### Modelo de Datos Actualizado

**Nuevos campos en Attachment:**
```typescript
{
  // ... campos existentes ...

  // Versionado
  version: number;          // default: 1
  parentId: ObjectId;       // Referencia al documento original
  isLatest: boolean;        // default: true
  versionNotes?: string;    // Notas sobre esta versión

  // Metadata para búsqueda
  tags: string[];           // Tags para categorización
  searchableText: string;   // Texto indexado para búsqueda
}
```

#### Índices Agregados
- (tenantId, employeeId, isLatest) - Queries de última versión
- (parentId, version) - Historial de versiones
- (tenantId, tags) - Búsquedas por tags
- Text index en searchableText - Full-text search

#### Nuevos Endpoints

**POST /api/v1/attachments/:id/versions**
- **Descripción**: Crear nueva versión de documento
- **Body**: Multipart file upload
- **Query Params**: `versionNotes` (opcional)
- **Funcionalidad**:
  - Marca versión anterior como no latest
  - Incrementa número de versión
  - Mantiene metadata del documento original

**GET /api/v1/attachments/:id/versions**
- **Descripción**: Obtener historial completo de versiones
- **Respuesta**: Array de versiones ordenadas por version DESC

**GET /api/v1/attachments/search**
- **Query Params**:
  - `employeeId` (opcional)
  - `fileType` (opcional)
  - `tags` (opcional, comma-separated)
  - `searchText` (opcional)
  - `onlyLatest` (boolean, default: true)
- **Descripción**: Búsqueda avanzada con múltiples filtros

**GET /api/v1/attachments/:id/preview**
- **Descripción**: Preview inline de documento
- **Headers**: Content-Disposition: inline
- **Soporte**: PDF, imágenes

#### Funciones de Servicio

**createVersion()**
- Crea nueva versión de documento existente
- Hereda metadata del padre
- Gestiona árbol de versiones (parent/child)

**getVersionHistory()**
- Retorna todas las versiones de un documento
- Incluye versión raíz y todas las hijas

**searchAttachments()**
- Búsqueda con filtros múltiples
- Full-text search con MongoDB $text
- Filtro por tags con $in
- Solo últimas versiones o todas

### Frontend

#### Componentes

**DocumentPreview** (`web/src/components/DocumentPreview.tsx`)

**Características:**
- Modal full-screen para preview
- Preview de PDFs con iframe
- Preview de imágenes con scaling correcto
- Botón de descarga en header
- Manejo de errores con fallback
- Loading states
- Cierre con ESC o botón X
- Dark mode support

**Tipos soportados:**
- PDF (application/pdf)
- Imágenes (image/*)
- Fallback para otros tipos

**Enhanced EmployeeDocuments Page**

**Nuevas Características:**
- **Búsqueda**:
  - Input de búsqueda con icono
  - Filtro por tipo de documento
  - Botón "Limpiar filtros"
  - Contador de resultados

- **Preview**:
  - Botón "Ver" para PDFs e imágenes
  - Integración con DocumentPreview component
  - Preview inline en modal

- **Historial de Versiones**:
  - Botón History en cada documento
  - Modal con lista de versiones
  - Badge "Actual" para última versión
  - Versión destacada con borde azul
  - Notas de versión visibles
  - Preview y descarga por versión

- **UI Mejorada**:
  - Layout flexible de botones
  - Iconos lucide-react (Search, Eye, Download, History)
  - Estados vacíos mejorados
  - Responsive design

#### Navegación
- Ruta: `/employee/documents` (Employee Portal)

---

## Instalación y Configuración

### Backend

No requiere configuración adicional. Los nuevos endpoints están automáticamente registrados.

**Índices MongoDB**: Se crean automáticamente al iniciar la aplicación.

### Frontend

No requiere dependencias adicionales. Todas las librerías necesarias ya están instaladas:
- recharts (para gráficos)
- lucide-react (para iconos)
- @tanstack/react-query (para data fetching)

---

## Testing

### Backend

**Analytics:**
```bash
# Test dashboard KPIs
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/v1/analytics/dashboard

# Test trends
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/v1/analytics/trends/new-hires?months=6"
```

**RBAC:**
```bash
# List roles
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/v1/permissions/roles

# Get my permissions
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/v1/permissions/me
```

**Benefits:**
```bash
# List benefits
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/v1/benefits

# Assign benefit
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"benefitId":"...", "employeeId":"..."}' \
  http://localhost:3000/api/v1/employee-benefits
```

**Documents:**
```bash
# Search documents
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/v1/attachments/search?searchText=contract"

# Get version history
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/v1/attachments/<id>/versions
```

### Frontend

1. **Dashboard Analytics**: Navegar a `/analiticas`
2. **RBAC**: Navegar a `/roles` y `/mis-permisos`
3. **Benefits**: Navegar a `/beneficios` (Admin) o `/employee/benefits` (Employee)
4. **Documents**: Navegar a `/employee/documents`

---

## Seguridad

### Permisos por Feature

**Analytics:**
- `reports.read` - Requerido para todos los endpoints

**RBAC:**
- `users.read` - Ver roles y permisos
- `users.manage` - Crear/editar/eliminar roles personalizados

**Benefits:**
- `settings.manage` - Gestionar catálogo de beneficios
- `employees.update` - Asignar beneficios a empleados
- `settings.read` - Ver beneficios disponibles

**Documents:**
- Todos los usuarios autenticados pueden gestionar sus documentos
- Versionado y búsqueda disponibles para todos

### Multi-tenancy

Todas las features respetan aislamiento por tenant:
- Filtrado automático por tenantId
- Sin acceso cross-tenant
- Validaciones en backend

---

## Performance

### Analytics
- Queries paralelas con Promise.all
- Agregaciones optimizadas de MongoDB
- Límite de 10 resultados en distribuciones
- Cache de React Query (1-5 minutos)
- Auto-refresh configurable

### RBAC
- Cache de permisos (2-5 minutos)
- Invalidación automática en cambios
- Queries optimizadas con índices

### Benefits
- Índices compuestos para queries frecuentes
- Cache de 30 segundos a 2 minutos
- Invalidación en mutaciones

### Documents
- Índices de texto para búsqueda rápida
- Preview inline sin descarga completa
- Búsqueda del lado del cliente
- Lazy loading de versiones

---

## Próximos Pasos

Ver [SPRINT4.md](./SPRINT4.md) para las próximas funcionalidades planificadas.

---

## Soporte

Para reportar issues o solicitar features:
1. Crear issue en GitHub
2. Incluir logs relevantes
3. Describir pasos para reproducir
4. Adjuntar screenshots si es UI

---

**Versión**: Sprint 3
**Fecha**: Octubre 2025
**Estado**: ✅ Completado
