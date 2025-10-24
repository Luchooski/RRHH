# RRHH Agent - Sistema de Gestión de Recursos Humanos

Sistema completo de RRHH con multi-tenancy para gestión de empleados, reclutamiento, nóminas y portal de empleados.

## Características Principales

### 🏢 Multi-Tenancy
- Aislamiento completo de datos por empresa/tenant
- Registro de empresas independiente
- Sistema de usuarios con roles (superadmin, admin, hr, recruiter, employee)

### 👥 Gestión de Empleados
- CRUD completo de empleados
- Adjuntos (DNI, CV, contratos, certificados) con **versionado**
- Portal de empleados para auto-consulta
- Asistencias y horarios
- Licencias y vacaciones

### 💼 Reclutamiento
- Gestión de vacantes con checklist y notas
- Pipeline de aplicaciones (Kanban drag & drop)
- Gestión de candidatos
- Programación de entrevistas

### 💰 Nóminas (Payroll)
- Generación de recibos de liquidación
- Conceptos remunerativos y deducciones
- Exportación a PDF
- Historial completo por empleado

### 📊 Dashboard & Analytics **[Sprint 3]**
- KPIs en tiempo real (5 categorías)
- Métricas de reclutamiento, empleados, asistencia, licencias y beneficios
- Gráficos interactivos (bar, pie, line, area charts)
- Tendencias temporales con filtros configurables
- Auto-refresh cada 5 minutos

### 🎁 Sistema de Beneficios **[Sprint 3]**
- Catálogo de 14 tipos de beneficios
- Reglas de elegibilidad (antigüedad, rol, departamento)
- Workflow de asignación y aprobación
- Tracking de costos (empresa vs empleado)
- Portal de empleado con vista de beneficios activos

### 🔐 RBAC - Roles y Permisos **[Sprint 3]**
- 67 permisos granulares en 17 módulos
- 5 roles predefinidos (admin, hr, employee, manager, recruiter)
- Creación de roles personalizados
- UI de gestión de roles y permisos
- Vista de permisos del usuario actual

### 📁 Gestión de Documentos Avanzada **[Sprint 3]**
- **Versionado completo** con historial
- **Búsqueda avanzada** (texto, tags, tipo)
- **Preview inline** de PDFs e imágenes
- Notas de versión
- Full-text search con MongoDB

### 🔐 Autenticación y Seguridad
- JWT con dual-token (access + refresh tokens)
- HTTP-only cookies
- Rotación de refresh tokens
- Rate limiting
- CORS configurado
- Auditoría completa de acciones

### 📄 Portal de Empleados
- Visualización de perfil personal
- Historial de recibos de pago
- Descarga de PDFs
- Gestión de documentos (preview, versiones, búsqueda)
- Solicitud de licencias
- Registro de asistencia
- Vista de beneficios asignados

## Tecnologías

### Backend (API)
- **Fastify 5.6** - Framework web de alto rendimiento
- **TypeScript** - Tipado estático
- **MongoDB + Mongoose** - Base de datos NoSQL
- **Zod** - Validación de schemas
- **JWT** - Autenticación
- **PDFKit** - Generación de PDFs
- **Bcrypt** - Hash de passwords

### Frontend (Web)
- **React 19** - UI library
- **TypeScript** - Tipado estático
- **Vite** - Build tool
- **TanStack Query** - Gestión de estado server
- **React Router** - Routing
- **Axios** - Cliente HTTP
- **Tailwind CSS** - Estilos
- **DND Kit** - Drag and drop

## Estructura del Proyecto

```
RRHH/
├── api/                      # Backend (Fastify + TypeScript)
│   ├── src/
│   │   ├── modules/          # Módulos funcionales
│   │   │   ├── auth/         # Autenticación
│   │   │   ├── tenant/       # Multi-tenancy
│   │   │   ├── user/         # Usuarios
│   │   │   ├── employee/     # Empleados
│   │   │   ├── candidate/    # Candidatos
│   │   │   ├── vacancy/      # Vacantes
│   │   │   ├── interview/    # Entrevistas
│   │   │   ├── application/  # Aplicaciones
│   │   │   ├── payroll/      # Nóminas
│   │   │   ├── client/       # Clientes
│   │   │   ├── attachment/   # Adjuntos
│   │   │   └── employee-portal/  # Portal empleados
│   │   ├── middlewares/      # Auth, error handling
│   │   ├── config/           # DB, env
│   │   ├── app.ts            # App setup
│   │   └── server.ts         # Entry point
│   ├── uploads/              # Archivos subidos
│   ├── .env.example          # Variables de entorno
│   ├── railway.json          # Config Railway
│   └── package.json
│
├── web/                      # Frontend (React + Vite)
│   ├── src/
│   │   ├── features/         # Features por módulo
│   │   ├── components/       # Componentes reutilizables
│   │   ├── lib/              # Utilidades
│   │   └── App.tsx
│   ├── netlify.toml          # Config Netlify
│   ├── .env.example          # Variables de entorno
│   └── package.json
│
├── ENVIRONMENT_VARIABLES.md  # Guía de variables de entorno
└── README.md                 # Este archivo
```

## Instalación Local

### Prerequisitos

- Node.js 20+
- MongoDB 6+
- npm o yarn

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd RRHH
```

### 2. Configurar Backend (API)

```bash
cd api
npm install

# Copiar y configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores
```

**Variables mínimas en `.env`:**
```bash
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/rrhh-dev
JWT_SECRET=dev-secret-key-min-32-chars
COOKIE_SIGN_SECRET=dev-cookie-secret-32-chars
CORS_ORIGIN=http://localhost:5173
```

**Iniciar servidor:**
```bash
npm run dev
```

El API estará corriendo en `http://localhost:3000`

### 3. Configurar Frontend (Web)

```bash
cd ../web
npm install

# Copiar y configurar variables de entorno
cp .env.example .env.local
# Editar .env.local
```

**Variables en `.env.local`:**
```bash
VITE_API_URL=http://localhost:3000/api/v1
```

**Iniciar aplicación:**
```bash
npm run dev
```

La web estará corriendo en `http://localhost:5173`

## Deployment

### Backend → Railway

1. Crear cuenta en [Railway](https://railway.app)
2. New Project → Deploy from GitHub
3. Seleccionar carpeta `api`
4. Configurar variables de entorno (ver `ENVIRONMENT_VARIABLES.md`)
5. Deploy automático

**Variables críticas:**
- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Secret para JWT
- `COOKIE_SIGN_SECRET` - Secret para cookies
- `CORS_ORIGIN` - URL de Netlify

Ver guía completa en: `ENVIRONMENT_VARIABLES.md`

### Frontend → Netlify

1. Crear cuenta en [Netlify](https://netlify.com)
2. New site from Git → GitHub
3. Configurar:
   - Base directory: `web`
   - Build command: `npm run build`
   - Publish directory: `web/dist`
4. Environment variables:
   - `VITE_API_URL` - URL de Railway API
5. Deploy

## API Endpoints

### Autenticación
```
POST   /api/v1/auth/login          # Login (access + refresh tokens)
POST   /api/v1/auth/refresh        # Renovar access token
POST   /api/v1/auth/logout         # Logout
```

### Tenants
```
POST   /api/v1/tenants/register    # Registrar empresa (público)
GET    /api/v1/tenants/:id         # Obtener tenant
PATCH  /api/v1/tenants/:id         # Actualizar tenant
GET    /api/v1/tenants             # Listar tenants (superadmin)
```

### Empleados
```
GET    /api/v1/employees           # Listar empleados
GET    /api/v1/employees/:id       # Obtener empleado
POST   /api/v1/employees           # Crear empleado
PATCH  /api/v1/employees/:id       # Actualizar empleado
DELETE /api/v1/employees/:id       # Eliminar empleado
```

### Adjuntos
```
POST   /api/v1/employees/:id/attachments       # Subir archivo
GET    /api/v1/employees/:id/attachments       # Listar archivos
GET    /api/v1/attachments/:id/download        # Descargar archivo
DELETE /api/v1/attachments/:id                 # Eliminar archivo
```

### Candidatos
```
GET    /api/v1/candidates          # Listar candidatos
POST   /api/v1/candidates          # Crear candidato
PATCH  /api/v1/candidates/:id      # Actualizar candidato
DELETE /api/v1/candidates/:id      # Eliminar candidato
```

### Vacantes
```
GET    /api/v1/vacancies           # Listar vacantes
POST   /api/v1/vacancies           # Crear vacante
PATCH  /api/v1/vacancies/:id       # Actualizar vacante
DELETE /api/v1/vacancies/:id       # Eliminar vacante
POST   /api/v1/vacancies/:id/checklist    # Agregar checklist item
POST   /api/v1/vacancies/:id/notes        # Agregar nota
```

### Entrevistas
```
GET    /api/v1/interviews          # Listar entrevistas
POST   /api/v1/interviews          # Crear entrevista
PATCH  /api/v1/interviews/:id      # Actualizar entrevista
DELETE /api/v1/interviews/:id      # Eliminar entrevista
```

### Aplicaciones
```
GET    /api/v1/applications        # Listar aplicaciones
POST   /api/v1/applications        # Crear aplicación
PATCH  /api/v1/applications/:id    # Actualizar aplicación
POST   /api/v1/applications/reorder  # Reordenar (drag & drop)
```

### Nóminas (Payroll)
```
GET    /api/v1/payrolls            # Listar nóminas
GET    /api/v1/payrolls/:id        # Obtener nómina
POST   /api/v1/payrolls            # Crear nómina
PUT    /api/v1/payrolls/:id        # Actualizar nómina
DELETE /api/v1/payrolls/:id        # Eliminar nómina
PATCH  /api/v1/payrolls/:id/approve       # Aprobar nómina
PATCH  /api/v1/payrolls/:id/status        # Cambiar estado
GET    /api/v1/payrolls/:id/receipt.pdf   # Descargar PDF
```

### Portal de Empleados
```
GET    /api/v1/employee-portal/profile              # Ver perfil
GET    /api/v1/employee-portal/payrolls             # Listar recibos
GET    /api/v1/employee-portal/payrolls/:id         # Ver recibo
GET    /api/v1/employee-portal/payrolls/:id/receipt.pdf  # Descargar PDF
GET    /api/v1/employee-portal/attachments          # Listar archivos
GET    /api/v1/employee-portal/attachments/:id/download  # Descargar archivo
```

### Clientes
```
GET    /api/v1/clients             # Listar clientes
POST   /api/v1/clients             # Crear cliente
PATCH  /api/v1/clients/:id         # Actualizar cliente
DELETE /api/v1/clients/:id         # Eliminar cliente
```

## Scripts

### Backend (api/)
```bash
npm run dev        # Desarrollo con hot reload
npm run build      # Build para producción
npm start          # Ejecutar build de producción
npm run typecheck  # Verificar tipos
npm run lint       # Linter
npm test           # Tests
```

### Frontend (web/)
```bash
npm run dev        # Desarrollo con hot reload
npm run build      # Build para producción
npm run preview    # Preview del build
npm run typecheck  # Verificar tipos
npm run lint       # Linter
npm test           # Tests
```

## Flujo de Trabajo

### 1. Registro de Empresa (Tenant)
```
POST /api/v1/tenants/register
{
  "name": "Mi Empresa SRL",
  "email": "admin@miempresa.com",
  "adminUser": {
    "name": "Juan Admin",
    "email": "admin@miempresa.com",
    "password": "Password123!"
  }
}
```

Crea automáticamente:
- Tenant (empresa)
- Usuario admin
- Retorna: tenantId y userId

### 2. Login
```
POST /api/v1/auth/login
{
  "email": "admin@miempresa.com",
  "password": "Password123!"
}
```

Retorna:
- Access token (15 min, en cookie)
- Refresh token (7 días, en cookie)
- User info con tenantId y role

### 3. Crear Empleado
```
POST /api/v1/employees
Headers: Cookie con JWT
{
  "name": "María López",
  "email": "maria@miempresa.com",
  "role": "Desarrolladora",
  "baseSalary": 150000,
  "monthlyHours": 160,
  "phone": "+54 11 1234-5678"
}
```

### 4. Crear Usuario Employee
Para que el empleado acceda al portal, crear cuenta con role='employee'

### 5. Subir Archivos
```
POST /api/v1/employees/:id/attachments?fileType=cv
Content-Type: multipart/form-data
Body: file
```

### 6. Crear Nómina
```
POST /api/v1/payrolls
{
  "employeeId": "...",
  "employeeName": "María López",
  "period": "2024-03",
  "type": "mensual",
  "baseSalary": 150000,
  "concepts": [
    { "code": "001", "label": "Presentismo", "type": "remunerativo", "amount": 10000 }
  ],
  "deductions": [
    { "code": "D001", "label": "Jubilación", "amount": 15000 }
  ]
}
```

El sistema calcula automáticamente totales.

## Seguridad

### Implementado ✅
- JWT con short-lived access tokens (15 min)
- Refresh token rotation
- HTTP-only cookies
- bcrypt para passwords (10 rounds)
- Rate limiting (100 req/min)
- CORS configurado
- Input validation con Zod
- Multi-tenancy isolation
- Role-based access control

### Recomendaciones Adicionales
- [ ] Configurar HTTPS en producción
- [ ] Helmet headers para producción
- [ ] Content Security Policy
- [ ] Rotación periódica de secrets
- [ ] Backup automático de MongoDB
- [ ] Monitoring y alertas
- [ ] Logs agregados (ELK, Datadog)

## Troubleshooting

### API no conecta a MongoDB
- Verificar MONGODB_URI en .env
- Verificar MongoDB está corriendo localmente
- Verificar IP whitelist en MongoDB Atlas

### CORS errors
- Verificar CORS_ORIGIN coincide con URL del frontend
- Verificar COOKIE_SAME_SITE y COOKIE_SECURE
- Verificar cookies se están enviando

### Tokens no funcionan
- Verificar JWT_SECRET está configurado
- Verificar cookies HTTP-only están habilitadas
- Verificar frontend envía credentials

### Build falla en Railway
- Verificar todas las dependencias en package.json
- Verificar TypeScript compila localmente
- Revisar logs de build en Railway

## Contribuir

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## Licencia

Propietario: [Tu Nombre/Empresa]

## Soporte

Para problemas o preguntas:
- Crear issue en GitHub
- Email: soporte@tuempresa.com

## Roadmap

### v1.0 (MVP) ✅
- [x] Multi-tenancy completo
- [x] Autenticación con dual-token
- [x] CRUD de empleados
- [x] Sistema de adjuntos
- [x] Reclutamiento básico
- [x] Nóminas con PDF
- [x] Portal de empleados

### v1.1 (Próximas Features)
- [ ] Ausencias y vacaciones
- [ ] Evaluaciones de desempeño
- [ ] Onboarding workflows
- [ ] Firma electrónica de documentos
- [ ] Reportes avanzados
- [ ] Integración con contabilidad
- [ ] Notificaciones por email
- [ ] Chat interno

### v2.0 (Futuro)
- [ ] App móvil
- [ ] IA para screening de CVs
- [ ] Analíticas predictivas
- [ ] Integración con AFIP (Argentina)
- [ ] Multi-idioma
- [ ] Compliance GDPR

---

**Built with ❤️ using Fastify, React, and TypeScript**
