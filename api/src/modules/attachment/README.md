# Employee Attachments Module

Sistema de gestión de archivos adjuntos para empleados (DNI, CV, contratos, certificados, fotos, etc.).

## Características

- Subida de archivos con validación de tamaño (max 10MB)
- Almacenamiento local en disco con nombres únicos
- Tipos de archivo: `dni`, `cv`, `contract`, `certificate`, `photo`, `other`
- Aislamiento por tenant (multi-tenancy)
- Acceso controlado: HR/Admin pueden gestionar, empleados solo pueden ver sus propios archivos

## Endpoints para HR/Admin

Todas las rutas requieren autenticación.

### 1. Subir Archivo

```
POST /api/v1/employees/:employeeId/attachments?fileType=dni&description=DNI Frontal
Content-Type: multipart/form-data
```

Body: archivo como `multipart/form-data`

Query params:
- `fileType` (opcional): `dni`, `cv`, `contract`, `certificate`, `photo`, `other` (default: `other`)
- `description` (opcional): Descripción del archivo

Respuesta:
```json
{
  "id": "507f1f77bcf86cd799439011",
  "employeeId": "507f1f77bcf86cd799439012",
  "filename": "documento.pdf",
  "storedFilename": "1710445678901-a1b2c3d4e5f6.pdf",
  "fileType": "dni",
  "mimeType": "application/pdf",
  "size": 245678,
  "uploadedBy": "507f1f77bcf86cd799439013",
  "description": "DNI Frontal",
  "createdAt": "2024-03-15T10:30:00.000Z",
  "updatedAt": "2024-03-15T10:30:00.000Z"
}
```

### 2. Listar Archivos de un Empleado

```
GET /api/v1/employees/:employeeId/attachments?fileType=cv
```

Query params:
- `fileType` (opcional): Filtrar por tipo de archivo

Respuesta:
```json
{
  "items": [
    {
      "id": "507f1f77bcf86cd799439011",
      "employeeId": "507f1f77bcf86cd799439012",
      "filename": "cv.pdf",
      "storedFilename": "1710445678901-a1b2c3d4e5f6.pdf",
      "fileType": "cv",
      "mimeType": "application/pdf",
      "size": 345678,
      "uploadedBy": "507f1f77bcf86cd799439013",
      "description": "CV actualizado 2024",
      "createdAt": "2024-03-15T10:30:00.000Z",
      "updatedAt": "2024-03-15T10:30:00.000Z"
    }
  ],
  "total": 1
}
```

### 3. Descargar Archivo

```
GET /api/v1/attachments/:id/download
```

Devuelve el archivo con headers apropiados:
- `Content-Type`: tipo MIME del archivo
- `Content-Disposition`: attachment con nombre original

### 4. Eliminar Archivo

```
DELETE /api/v1/attachments/:id
```

Respuesta:
```json
{
  "ok": true
}
```

## Endpoints para Employee Portal

Los empleados pueden ver y descargar **solo sus propios archivos**.

### 1. Listar Mis Archivos

```
GET /api/v1/employee-portal/attachments?fileType=dni
```

Requiere rol `employee`.

Query params:
- `fileType` (opcional): Filtrar por tipo de archivo

Respuesta:
```json
{
  "items": [
    {
      "id": "507f1f77bcf86cd799439011",
      "filename": "dni.pdf",
      "fileType": "dni",
      "mimeType": "application/pdf",
      "size": 245678,
      "description": "DNI Frontal",
      "createdAt": "2024-03-15T10:30:00.000Z"
    }
  ],
  "total": 1
}
```

### 2. Descargar Mi Archivo

```
GET /api/v1/employee-portal/attachments/:id/download
```

Requiere rol `employee`. Solo puede descargar sus propios archivos.

## Modelo de Datos

```typescript
{
  tenantId: string;          // ID del tenant
  employeeId: string;        // ID del empleado
  filename: string;          // Nombre original del archivo
  storedFilename: string;    // Nombre único en disco
  fileType: 'dni' | 'cv' | 'contract' | 'certificate' | 'photo' | 'other';
  mimeType: string;          // Tipo MIME (application/pdf, image/jpeg, etc.)
  size: number;              // Tamaño en bytes
  path: string;              // Ruta en el sistema de archivos (no expuesta en API)
  uploadedBy: string;        // ID del usuario que subió el archivo
  description?: string;      // Descripción opcional
  createdAt: Date;
  updatedAt: Date;
}
```

## Almacenamiento

Los archivos se guardan en la carpeta `uploads/` del proyecto con nombres únicos generados automáticamente:

```
uploads/
  ├── 1710445678901-a1b2c3d4e5f6.pdf
  ├── 1710445789123-b2c3d4e5f6a1.jpg
  └── ...
```

Formato del nombre: `{timestamp}-{random}.{ext}`

## Seguridad

- **Multi-tenancy**: Todos los archivos están aislados por tenantId
- **Validación de tamaño**: Máximo 10MB por archivo
- **Control de acceso**:
  - HR/Admin: Pueden subir, ver, descargar y eliminar cualquier archivo de su tenant
  - Employees: Solo pueden ver y descargar sus propios archivos
- **Archivos físicos**: Los nombres internos no se exponen en la API
- **Rutas protegidas**: Todas requieren autenticación

## Tipos de Archivo Soportados

- `dni`: Documento Nacional de Identidad
- `cv`: Curriculum Vitae
- `contract`: Contrato de trabajo
- `certificate`: Certificados (estudios, cursos, etc.)
- `photo`: Foto del empleado
- `other`: Otros documentos

## Ejemplo de Uso con cURL

### Subir un archivo

```bash
curl -X POST \
  'http://localhost:3000/api/v1/employees/507f1f77bcf86cd799439012/attachments?fileType=cv&description=CV%202024' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -F 'file=@/path/to/cv.pdf'
```

### Descargar un archivo

```bash
curl -X GET \
  'http://localhost:3000/api/v1/attachments/507f1f77bcf86cd799439011/download' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --output downloaded-file.pdf
```

## Notas

- La carpeta `uploads/` se crea automáticamente al iniciar la aplicación
- Al eliminar un archivo de la base de datos, también se elimina del disco
- Los archivos huérfanos (sin registro en BD) deben limpiarse manualmente
- Para producción, considerar usar servicios de almacenamiento en la nube (S3, etc.)
