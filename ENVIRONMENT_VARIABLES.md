# Environment Variables Guide

Esta guía explica todas las variables de entorno necesarias para el proyecto.

## API (Backend)

### Desarrollo Local

Copiar `api/.env.example` a `api/.env` y completar los valores:

```bash
# Server
NODE_ENV=development
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/rrhh-dev

# JWT
JWT_SECRET=dev-secret-key-min-32-chars-for-development
JWT_EXPIRES_IN=15m

# Cookies
COOKIE_SIGN_SECRET=dev-cookie-secret-32-chars
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
COOKIE_DOMAIN=

# CORS
CORS_ORIGIN=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# File Uploads
MAX_UPLOAD_MB=10
```

### Producción (Railway)

Configurar estas variables en Railway Dashboard:

#### Requeridas:

1. **NODE_ENV** = `production`
   - Activa modo producción

2. **PORT** = `3000` (Railway lo asigna automáticamente)
   - Puerto donde escucha el servidor

3. **MONGODB_URI** = `mongodb+srv://user:pass@cluster.mongodb.net/dbname`
   - **CRÍTICO**: String de conexión de MongoDB Atlas
   - Obtener desde MongoDB Atlas → Connect → Connect your application
   - Ejemplo: `mongodb+srv://admin:MyP@ssw0rd@cluster0.abc123.mongodb.net/rrhh-prod?retryWrites=true&w=majority`

4. **JWT_SECRET** = `your-super-secret-jwt-key-min-32-chars`
   - **CRÍTICO**: Clave secreta para firmar JWT
   - Mínimo 32 caracteres
   - Generar con: `openssl rand -base64 32`
   - NUNCA compartir o commitear

5. **JWT_EXPIRES_IN** = `15m`
   - Duración del access token (15 minutos recomendado)

6. **COOKIE_SIGN_SECRET** = `your-cookie-secret-min-32-chars`
   - **CRÍTICO**: Clave para firmar cookies
   - Mínimo 32 caracteres
   - Generar con: `openssl rand -base64 32`
   - Diferente a JWT_SECRET

7. **COOKIE_SECURE** = `true`
   - HTTPS only en producción

8. **COOKIE_SAME_SITE** = `none`
   - Necesario para CORS cross-domain
   - Alternativa: `lax` si API y frontend están en mismo dominio

9. **COOKIE_DOMAIN** = `` (vacío)
   - Dejar vacío para Railway
   - Solo configurar si usas dominio custom

10. **CORS_ORIGIN** = `https://your-app.netlify.app`
    - URL del frontend en Netlify
    - Ejemplo: `https://rrhh-app.netlify.app`

11. **ALLOWED_ORIGINS** = `https://your-app.netlify.app`
    - Lista separada por comas si tienes múltiples dominios
    - Ejemplo: `https://rrhh-app.netlify.app,https://rrhh.tudominio.com`

#### Opcionales:

12. **MAX_UPLOAD_MB** = `10`
    - Tamaño máximo de archivo (MB)
    - Default: 10MB

13. **LOG_LEVEL** = `info`
    - Nivel de logs: `debug`, `info`, `warn`, `error`
    - Default: `info`

---

## Frontend (Web)

### Desarrollo Local

Copiar `web/.env.example` a `web/.env.local`:

```bash
# API URL
VITE_API_URL=http://localhost:3000/api/v1

# Dev tools
VITE_ENABLE_DEV_TOOLS=true
```

### Producción (Netlify)

Configurar en Netlify Dashboard → Site settings → Environment variables:

1. **VITE_API_URL** = `https://your-api.up.railway.app/api/v1`
   - **CRÍTICO**: URL de tu API en Railway
   - Ejemplo: `https://rrhh-api-production.up.railway.app/api/v1`
   - Incluir el `/api/v1` al final

2. **VITE_ENABLE_DEV_TOOLS** = `false` (opcional)
   - Deshabilitar dev tools en producción

---

## Generación de Secrets

### Generar JWT_SECRET y COOKIE_SIGN_SECRET:

**En Linux/Mac:**
```bash
openssl rand -base64 32
```

**En Node.js:**
```javascript
require('crypto').randomBytes(32).toString('base64')
```

**Online:**
- https://generate-secret.vercel.app/32

---

## MongoDB Atlas Setup

1. Crear cuenta en https://www.mongodb.com/cloud/atlas
2. Crear un cluster (M0 free tier es suficiente para MVP)
3. Database Access → Add New Database User
   - Username: `admin` (o el que prefieras)
   - Password: Generar uno fuerte (guardar!)
4. Network Access → Add IP Address
   - Para Railway: Add `0.0.0.0/0` (permitir desde cualquier IP)
   - O configurar IPs específicas de Railway
5. Clusters → Connect → Connect your application
   - Copiar el connection string
   - Reemplazar `<password>` con tu password
   - Reemplazar `<database>` con `rrhh-prod` (o el nombre que quieras)

**Connection string final:**
```
mongodb+srv://admin:TuPasswordAqui@cluster0.abc123.mongodb.net/rrhh-prod?retryWrites=true&w=majority
```

---

## Checklist de Deployment

### Railway (API):

- [ ] Cuenta de Railway creada
- [ ] Proyecto creado
- [ ] Variables de entorno configuradas (12 variables)
- [ ] MongoDB Atlas configurado y connection string funcionando
- [ ] JWT_SECRET y COOKIE_SIGN_SECRET generados
- [ ] CORS_ORIGIN apunta a Netlify URL
- [ ] Deploy exitoso y logs sin errores

### Netlify (Frontend):

- [ ] Cuenta de Netlify creada
- [ ] Sitio creado desde GitHub repo
- [ ] Build command: `npm run build`
- [ ] Publish directory: `dist`
- [ ] VITE_API_URL apunta a Railway URL
- [ ] Deploy exitoso
- [ ] Redirecciones SPA funcionando

### Testing:

- [ ] Frontend carga correctamente
- [ ] Login funciona
- [ ] Tokens se guardan en cookies
- [ ] API responde correctamente
- [ ] CORS no da errores
- [ ] Refresh token funciona

---

## Troubleshooting

### Error: "CORS not allowed"
- Verificar que CORS_ORIGIN en Railway coincida exactamente con URL de Netlify
- Verificar que COOKIE_SAME_SITE sea `none` en producción
- Verificar que COOKIE_SECURE sea `true`

### Error: "MongooseServerSelectionError"
- Verificar MONGODB_URI está correcto
- Verificar password no tiene caracteres especiales sin encodear
- Verificar Network Access en MongoDB Atlas permite Railway IPs

### Error: "Invalid token"
- Verificar JWT_SECRET es el mismo en todos los ambientes
- Verificar que no expira demasiado rápido (JWT_EXPIRES_IN)

### Error: "Cannot set cookies"
- Verificar COOKIE_SECURE=true en producción
- Verificar COOKIE_SAME_SITE=none para cross-domain
- Verificar dominio de frontend es HTTPS

---

## Seguridad

### ⚠️ NUNCA commitear:
- `.env` files
- Passwords
- JWT secrets
- API keys
- MongoDB connection strings

### ✅ SIEMPRE:
- Usar `.env.example` sin valores reales
- Rotar secrets periódicamente
- Usar secrets diferentes por ambiente
- Configurar IP whitelist en MongoDB
- Habilitar HTTPS en producción
