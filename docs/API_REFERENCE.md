# API Reference - Sprint 3

## Índice
- [Analytics](#analytics)
- [RBAC (Roles y Permisos)](#rbac)
- [Benefits](#benefits)
- [Documents](#documents)

---

## Analytics

Base URL: `/api/v1/analytics`

### GET /dashboard

Obtiene todos los KPIs del dashboard.

**Autenticación**: Requerida
**Permisos**: `reports.read`

**Respuesta 200**:
```json
{
  "recruitment": {
    "totalCandidates": 150,
    "activeVacancies": 8,
    "applicationsThisMonth": 45,
    "avgTimeToHire": 21.5,
    "candidatesByStage": {
      "application_received": 50,
      "screening": 30,
      "interview_scheduled": 20,
      "interviewed": 15,
      "offer_extended": 8,
      "hired": 5,
      "rejected": 22
    }
  },
  "employees": {
    "totalActive": 120,
    "newHiresThisMonth": 5,
    "newHiresThisYear": 32,
    "byDepartment": [
      { "department": "IT", "count": 45 },
      { "department": "Sales", "count": 30 },
      { "department": "Marketing", "count": 20 }
    ],
    "byPosition": [
      { "position": "Developer", "count": 35 },
      { "position": "Sales Rep", "count": 25 }
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
      "sick_leave": 5,
      "personal": 2
    }
  },
  "benefits": {
    "totalMonthlyCost": 125000,
    "activeAssignments": 200,
    "costPerEmployee": 1041.67,
    "byType": {
      "health_insurance": 80,
      "meal_vouchers": 120,
      "gym": 50
    }
  }
}
```

### GET /trends/new-hires

Obtiene tendencia de nuevas contrataciones.

**Query Parameters**:
- `months` (number, 1-12): Número de meses hacia atrás. Default: 6

**Autenticación**: Requerida
**Permisos**: `reports.read`

**Respuesta 200**:
```json
[
  { "date": "2025-05", "value": 8 },
  { "date": "2025-06", "value": 12 },
  { "date": "2025-07", "value": 6 },
  { "date": "2025-08", "value": 10 },
  { "date": "2025-09", "value": 9 },
  { "date": "2025-10", "value": 5 }
]
```

### GET /trends/applications

Obtiene tendencia de aplicaciones recibidas.

**Query Parameters**:
- `months` (number, 1-12): Número de meses hacia atrás. Default: 6

**Autenticación**: Requerida
**Permisos**: `reports.read`

**Respuesta 200**: Same format as `/trends/new-hires`

### GET /trends/attendance

Obtiene tendencia de tasa de asistencia.

**Query Parameters**:
- `days` (number, 1-365): Número de días hacia atrás. Default: 30

**Autenticación**: Requerida
**Permisos**: `reports.read`

**Respuesta 200**:
```json
[
  { "date": "2025-10-01", "value": 96.5 },
  { "date": "2025-10-02", "value": 95.2 },
  { "date": "2025-10-03", "value": 97.1 }
]
```

---

## RBAC

Base URL: `/api/v1/permissions`

### GET /roles

Lista todos los roles (predefinidos + personalizados).

**Autenticación**: Requerida
**Permisos**: `users.read`

**Respuesta 200**:
```json
[
  {
    "id": "role_id_1",
    "tenantId": "tenant_123",
    "name": "admin",
    "description": "Full system access",
    "permissions": ["*"],
    "isCustom": false,
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z"
  },
  {
    "id": "role_id_2",
    "tenantId": "tenant_123",
    "name": "custom_role_1",
    "description": "Custom role for team leads",
    "permissions": ["employees.read", "employees.update", "leaves.approve"],
    "isCustom": true,
    "createdAt": "2025-03-20T14:30:00Z",
    "updatedAt": "2025-03-20T14:30:00Z"
  }
]
```

### GET /roles/:name

Obtiene un rol específico por nombre.

**Parámetros**:
- `name` (string): Nombre del rol

**Autenticación**: Requerida
**Permisos**: `users.read`

**Respuesta 200**: Objeto de rol individual (ver ejemplo arriba)
**Respuesta 404**: `{ "error": "Not Found", "message": "Rol no encontrado" }`

### POST /roles

Crea un rol personalizado.

**Body**:
```json
{
  "name": "team_lead",
  "description": "Team lead with approval rights",
  "permissions": [
    "employees.read",
    "employees.update",
    "leaves.read",
    "leaves.approve",
    "attendance.read"
  ]
}
```

**Autenticación**: Requerida
**Permisos**: `users.manage`

**Respuesta 201**: Objeto de rol creado
**Respuesta 400**: Validación fallida

### PUT /roles/:id

Actualiza un rol personalizado.

**Parámetros**:
- `id` (string): ID del rol

**Body** (todos opcionales):
```json
{
  "name": "senior_team_lead",
  "description": "Updated description",
  "permissions": ["employees.read", "employees.update", "employees.delete"]
}
```

**Autenticación**: Requerida
**Permisos**: `users.manage`

**Respuesta 200**: Objeto de rol actualizado
**Respuesta 404**: Rol no encontrado

### DELETE /roles/:id

Elimina un rol personalizado.

**Parámetros**:
- `id` (string): ID del rol

**Autenticación**: Requerida
**Permisos**: `users.manage`

**Respuesta 200**: `{ "success": true }`
**Respuesta 404**: Rol no encontrado

### GET /all

Lista todos los permisos disponibles en el sistema.

**Autenticación**: Requerida
**Permisos**: `users.read`

**Respuesta 200**:
```json
[
  "candidates.create",
  "candidates.read",
  "candidates.update",
  "candidates.delete",
  "employees.create",
  "employees.read",
  ...
]
```

### GET /me

Obtiene los permisos efectivos del usuario actual.

**Autenticación**: Requerida

**Respuesta 200**:
```json
{
  "role": "hr",
  "permissions": [
    "candidates.create",
    "candidates.read",
    "candidates.update",
    "employees.create",
    ...
  ]
}
```

---

## Benefits

Base URL: `/api/v1`

### POST /benefits

Crea un nuevo beneficio en el catálogo.

**Body**:
```json
{
  "name": "Seguro Médico Premium",
  "type": "health_insurance",
  "description": "Cobertura médica completa",
  "costToCompany": 5000,
  "costToEmployee": 1000,
  "frequency": "monthly",
  "provider": "Health Insurance Co.",
  "eligibility": {
    "minMonthsEmployment": 3,
    "roles": ["employee", "manager"],
    "departments": ["IT", "Sales"]
  },
  "requiresApproval": true,
  "status": "active"
}
```

**Autenticación**: Requerida
**Permisos**: `settings.manage`

**Respuesta 201**: Objeto de beneficio creado

### GET /benefits

Lista todos los beneficios.

**Query Parameters**:
- `type` (BenefitType): Filtrar por tipo
- `status` (string): 'active' | 'inactive'

**Autenticación**: Requerida
**Permisos**: `settings.read`

**Respuesta 200**:
```json
{
  "items": [
    {
      "id": "benefit_id_1",
      "tenantId": "tenant_123",
      "name": "Seguro Médico Premium",
      "type": "health_insurance",
      "costToCompany": 5000,
      "costToEmployee": 1000,
      "frequency": "monthly",
      "status": "active",
      ...
    }
  ],
  "total": 10
}
```

### GET /benefits/:id

Obtiene un beneficio específico.

**Autenticación**: Requerida
**Permisos**: `settings.read`

**Respuesta 200**: Objeto de beneficio

### PUT /benefits/:id

Actualiza un beneficio.

**Body**: Campos a actualizar (todos opcionales)

**Autenticación**: Requerida
**Permisos**: `settings.manage`

**Respuesta 200**: Objeto de beneficio actualizado

### DELETE /benefits/:id

Elimina un beneficio del catálogo.

**Autenticación**: Requerida
**Permisos**: `settings.manage`

**Respuesta 200**: `{ "success": true }`

### POST /employee-benefits

Asigna un beneficio a un empleado.

**Body**:
```json
{
  "benefitId": "benefit_id_1",
  "employeeId": "employee_id_1",
  "startDate": "2025-11-01",
  "endDate": "2026-10-31",
  "notes": "Requested by employee"
}
```

**Autenticación**: Requerida
**Permisos**: `employees.update`

**Respuesta 201**: Objeto de asignación creado

### GET /employee-benefits

Lista asignaciones de beneficios.

**Query Parameters**:
- `employeeId` (string): Filtrar por empleado
- `benefitId` (string): Filtrar por beneficio
- `status` (string): 'pending' | 'active' | 'rejected' | 'cancelled'

**Autenticación**: Requerida
**Permisos**: `settings.read`

**Respuesta 200**:
```json
{
  "items": [
    {
      "id": "assignment_id_1",
      "tenantId": "tenant_123",
      "benefitId": "benefit_id_1",
      "employeeId": "employee_id_1",
      "status": "active",
      "startDate": "2025-11-01",
      "endDate": "2026-10-31",
      ...
    }
  ],
  "total": 5
}
```

### PUT /employee-benefits/:id/approve

Aprueba una asignación de beneficio.

**Autenticación**: Requerida
**Permisos**: `settings.manage`

**Respuesta 200**: Objeto de asignación actualizado

### PUT /employee-benefits/:id/cancel

Cancela una asignación de beneficio.

**Body**:
```json
{
  "reason": "Employee no longer eligible"
}
```

**Autenticación**: Requerida
**Permisos**: `employees.update`

**Respuesta 200**: Objeto de asignación actualizado

### GET /employee-benefits/eligibility

Verifica elegibilidad de un empleado para un beneficio.

**Query Parameters**:
- `employeeId` (string): ID del empleado
- `benefitId` (string): ID del beneficio

**Autenticación**: Requerida
**Permisos**: `settings.read`

**Respuesta 200**:
```json
{
  "eligible": true,
  "reason": null
}
```
o
```json
{
  "eligible": false,
  "reason": "Empleado no cumple con el tiempo mínimo de antigüedad"
}
```

### GET /employee-benefits/cost-summary

Obtiene resumen de costos de beneficios.

**Query Parameters**:
- `employeeId` (string, opcional): Filtrar por empleado

**Autenticación**: Requerida
**Permisos**: `reports.read`

**Respuesta 200**:
```json
{
  "totalMonthlyCost": 15000,
  "totalYearlyCost": 180000,
  "costByEmployee": 12500,
  "costByCompany": 2500,
  "byType": {
    "health_insurance": 10000,
    "meal_vouchers": 3000,
    "gym": 2000
  }
}
```

---

## Documents

Base URL: `/api/v1/attachments`

### POST /:id/versions

Crea una nueva versión de un documento existente.

**Parámetros**:
- `id` (string): ID del documento

**Query Parameters**:
- `versionNotes` (string, opcional): Notas sobre esta versión

**Body**: Multipart form-data con archivo

**Autenticación**: Requerida

**Respuesta 201**:
```json
{
  "id": "attachment_id_2",
  "employeeId": "employee_id_1",
  "filename": "contract.pdf",
  "storedFilename": "1729785600000-abc123.pdf",
  "fileType": "contract",
  "mimeType": "application/pdf",
  "size": 524288,
  "uploadedBy": "user_id_1",
  "description": "Employment contract",
  "version": 2,
  "parentId": "attachment_id_1",
  "isLatest": true,
  "versionNotes": "Updated salary section",
  "createdAt": "2025-10-24T10:00:00Z",
  "updatedAt": "2025-10-24T10:00:00Z"
}
```

### GET /:id/versions

Obtiene el historial completo de versiones de un documento.

**Parámetros**:
- `id` (string): ID del documento

**Autenticación**: Requerida

**Respuesta 200**:
```json
{
  "items": [
    {
      "id": "attachment_id_2",
      "version": 2,
      "parentId": "attachment_id_1",
      "isLatest": true,
      "versionNotes": "Updated salary section",
      "createdAt": "2025-10-24T10:00:00Z",
      ...
    },
    {
      "id": "attachment_id_1",
      "version": 1,
      "parentId": null,
      "isLatest": false,
      "versionNotes": null,
      "createdAt": "2025-09-01T09:00:00Z",
      ...
    }
  ],
  "total": 2
}
```

### GET /search

Búsqueda avanzada de documentos.

**Query Parameters**:
- `employeeId` (string, opcional): Filtrar por empleado
- `fileType` (string, opcional): 'dni' | 'cv' | 'contract' | 'certificate' | 'photo' | 'other'
- `tags` (string, opcional): Tags separados por coma (ej: "important,2025")
- `searchText` (string, opcional): Texto para búsqueda full-text
- `onlyLatest` (boolean, opcional): Solo últimas versiones. Default: true

**Autenticación**: Requerida

**Ejemplo**:
```
GET /api/v1/attachments/search?searchText=contract&fileType=contract&onlyLatest=true
```

**Respuesta 200**:
```json
{
  "items": [
    {
      "id": "attachment_id_1",
      "filename": "contract.pdf",
      "fileType": "contract",
      "mimeType": "application/pdf",
      "size": 524288,
      "description": "Employment contract",
      "tags": ["important", "2025"],
      "version": 2,
      "isLatest": true,
      ...
    }
  ],
  "total": 1
}
```

### GET /:id/preview

Preview inline de documento (para visualización en navegador).

**Parámetros**:
- `id` (string): ID del documento

**Autenticación**: Requerida

**Respuesta 200**:
- Content-Type: application/pdf o image/*
- Content-Disposition: inline
- Body: Archivo binario

**Uso**:
```html
<iframe src="/api/v1/attachments/<id>/preview" />
<!-- o -->
<img src="/api/v1/attachments/<id>/preview" />
```

---

## Códigos de Error Comunes

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Validation error: ..."
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## Autenticación

Todos los endpoints requieren un token JWT en el header:

```
Authorization: Bearer <access_token>
```

El token debe obtenerse mediante login:

```bash
POST /api/v1/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Respuesta:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id_1",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "hr",
    "tenantId": "tenant_123"
  }
}
```

---

## Rate Limiting

Actualmente no implementado. Considerar agregar en futuras versiones.

---

## Versionado de API

Actualmente: `/api/v1`

Futuras versiones mantendrán compatibilidad hacia atrás o se expondrán en nuevos prefijos (ej: `/api/v2`).

---

**Última actualización**: Sprint 3 - Octubre 2025
