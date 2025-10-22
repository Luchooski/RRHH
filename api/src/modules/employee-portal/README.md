# Employee Portal

El portal de empleados permite que los empleados accedan a su información personal y recibos de pago.

## Características

1. **Ver perfil personal** - Información básica del empleado (solo lectura)
2. **Historial de recibos** - Lista de todos los recibos de pago
3. **Detalle de recibo** - Ver conceptos, deducciones y totales
4. **Descargar PDF** - Generar y descargar recibos en PDF

## Endpoints

### Autenticación

Los empleados usan el mismo endpoint de autenticación que los demás usuarios:

```
POST /api/v1/auth/login
{
  "email": "empleado@example.com",
  "password": "password123"
}
```

El JWT devuelto incluye `role: "employee"` y se usa para acceder a las rutas del portal.

### Portal Routes

Todas las rutas requieren autenticación y rol `employee`:

#### 1. Ver Perfil
```
GET /api/v1/employee-portal/profile
```

Respuesta:
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Juan Pérez",
  "email": "juan.perez@example.com",
  "role": "Desarrollador",
  "baseSalary": 150000,
  "monthlyHours": 160,
  "phone": "+54 11 1234-5678"
}
```

#### 2. Listar Recibos
```
GET /api/v1/employee-portal/payrolls?year=2024&limit=20&skip=0
```

Query params:
- `year` (opcional): Filtrar por año
- `limit` (opcional, default 50): Cantidad de resultados
- `skip` (opcional, default 0): Paginación

Respuesta:
```json
{
  "items": [
    {
      "id": "507f1f77bcf86cd799439011",
      "period": "2024-03",
      "type": "mensual",
      "status": "pagada",
      "netTotal": 135000,
      "currency": "ARS",
      "paymentDate": "2024-03-05T00:00:00.000Z",
      "createdAt": "2024-03-01T10:30:00.000Z"
    }
  ],
  "total": 12
}
```

#### 3. Ver Detalle de Recibo
```
GET /api/v1/employee-portal/payrolls/:id
```

Respuesta:
```json
{
  "id": "507f1f77bcf86cd799439011",
  "employeeName": "Juan Pérez",
  "period": "2024-03",
  "type": "mensual",
  "status": "pagada",
  "baseSalary": 150000,
  "concepts": [
    {
      "code": "001",
      "label": "Presentismo",
      "type": "remunerativo",
      "amount": 10000,
      "taxable": true
    }
  ],
  "deductions": [
    {
      "code": "D001",
      "label": "Jubilación",
      "amount": 15000
    }
  ],
  "grossTotal": 160000,
  "deductionsTotal": 25000,
  "netTotal": 135000,
  "currency": "ARS",
  "paymentMethod": "transferencia",
  "bankAccount": "0123456789",
  "paymentDate": "2024-03-05T00:00:00.000Z",
  "createdAt": "2024-03-01T10:30:00.000Z",
  "updatedAt": "2024-03-05T15:00:00.000Z"
}
```

#### 4. Descargar PDF
```
GET /api/v1/employee-portal/payrolls/:id/receipt.pdf
```

Devuelve un PDF con el recibo de liquidación.

## Seguridad

- Todas las rutas requieren autenticación mediante JWT
- Solo usuarios con `role: "employee"` pueden acceder
- Los empleados solo pueden ver sus propios datos
- El acceso se valida mediante el email del empleado

## Setup para Empleados

### 1. Crear registro de Employee

Primero crear el registro en la colección Employee:

```javascript
POST /api/v1/employees
{
  "name": "Juan Pérez",
  "email": "juan.perez@example.com",
  "role": "Desarrollador",
  "baseSalary": 150000,
  "monthlyHours": 160,
  "phone": "+54 11 1234-5678"
}
```

### 2. Crear cuenta de Usuario

Crear una cuenta User con el mismo email y rol `employee`:

```javascript
// Esto podría hacerse mediante un endpoint de admin o directamente en la DB
{
  "email": "juan.perez@example.com",
  "passwordHash": "<bcrypt hash de password>",
  "name": "Juan Pérez",
  "role": "employee",
  "tenantId": "<tenant_id>",
  "isActive": true
}
```

### 3. Login

El empleado puede hacer login con sus credenciales:

```javascript
POST /api/v1/auth/login
{
  "email": "juan.perez@example.com",
  "password": "password123"
}
```

Esto devuelve un JWT con `role: "employee"` que puede usar para acceder al portal.

## Flujo Recomendado

1. **HR crea el empleado** en el sistema mediante `/api/v1/employees`
2. **HR crea la cuenta de usuario** con rol `employee` y password temporal
3. **HR envía credenciales** al empleado por email seguro
4. **Empleado hace login** y accede al portal
5. **Empleado puede ver su perfil y recibos**

## Notas

- El empleado NO puede modificar su información personal
- Los recibos deben ser creados por HR/Admin mediante `/api/v1/payrolls`
- Solo los recibos del empleado autenticado son accesibles
- El sistema verifica que el `employeeId` del payroll coincida con el employee del usuario logueado
