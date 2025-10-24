# Deployment Guide - RRHH System

## Prerequisites

- MongoDB Atlas account (or MongoDB instance)
- Railway account (for backend)
- Netlify account (for frontend)
- Git repository

## Backend Deployment (Railway)

### 1. Prepare MongoDB

1. Create a MongoDB Atlas cluster or use existing MongoDB instance
2. Create a database named `rrhh`
3. Get your connection string

### 2. Deploy to Railway

1. Go to [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect the Node.js project

### 3. Configure Environment Variables

In Railway dashboard, add these environment variables:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rrhh
PORT=3000
NODE_ENV=production
JWT_SECRET=your-generated-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://your-frontend.netlify.app
ALLOWED_ORIGINS=https://your-frontend.netlify.app
COOKIE_SIGN_SECRET=your-cookie-secret-min-32-chars
COOKIE_SAME_SITE=none
COOKIE_SECURE=true
MAX_UPLOAD_MB=10
```

### 4. Generate Secrets

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate COOKIE_SIGN_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Deploy

Railway will automatically build and deploy. Get your backend URL (e.g., `https://your-app.up.railway.app`)

## Frontend Deployment (Netlify)

### 1. Configure Environment Variable

Create `web/.env.production`:

```
VITE_API_URL=https://your-backend.up.railway.app
```

### 2. Deploy to Netlify

**Option A: Netlify CLI**

```bash
cd web
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

**Option B: Netlify Dashboard**

1. Go to [Netlify](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository
4. Configure build settings:
   - Base directory: `web`
   - Build command: `npm install && npm run build`
   - Publish directory: `web/dist`

### 3. Configure Environment Variable in Netlify

In Netlify Dashboard:
1. Go to Site settings → Environment variables
2. Add:
   - Key: `VITE_API_URL`
   - Value: `https://your-backend.up.railway.app`

### 4. Update Backend CORS

After deploying frontend, update Railway environment variables:

```
CORS_ORIGIN=https://your-site.netlify.app
ALLOWED_ORIGINS=https://your-site.netlify.app
```

Redeploy backend in Railway.

## Post-Deployment Steps

### 1. Create Admin User

```bash
curl -X POST https://your-backend.up.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourcompany.com",
    "password": "SecurePassword123!",
    "name": "Admin User",
    "tenantId": "default"
  }'
```

### 2. Test the System

1. Visit your Netlify URL
2. Login with admin credentials
3. Test main features:
   - Employee management
   - Leave requests
   - Evaluations
   - Reports
   - Notifications

## Monitoring

### Railway

- Check logs in Railway dashboard
- Monitor CPU and memory usage
- Set up alerts

### Netlify

- Check deploy logs
- Monitor bandwidth
- Configure custom domain

## Troubleshooting

### Backend Issues

**MongoDB Connection Failed**
- Check MONGODB_URI is correct
- Ensure MongoDB Atlas allows Railway IP
- Verify database user permissions

**CORS Errors**
- Update CORS_ORIGIN with correct frontend URL
- Check COOKIE_SECURE is true
- Verify COOKIE_SAME_SITE is "none"

### Frontend Issues

**API Requests Failing**
- Check VITE_API_URL is correct
- Verify backend is running
- Check browser console for errors

**Build Failures**
- Check Node version (should be 20)
- Clear cache and rebuild
- Check for TypeScript errors

## Custom Domain (Optional)

### Backend (Railway)

1. Go to Railway project settings
2. Add custom domain
3. Update DNS records

### Frontend (Netlify)

1. Go to Netlify site settings
2. Add custom domain
3. Update DNS records
4. Netlify will auto-provision SSL

## Security Checklist

- ✅ JWT_SECRET is strong (32+ characters)
- ✅ COOKIE_SIGN_SECRET is strong (32+ characters)
- ✅ CORS configured with specific origins
- ✅ MongoDB credentials are secure
- ✅ HTTPS enabled (automatic on Railway/Netlify)
- ✅ Rate limiting configured
- ✅ Admin credentials are strong

## Backup Strategy

### MongoDB

1. Enable automated backups in MongoDB Atlas
2. Or set up manual backup cron job:

```bash
mongodump --uri="mongodb+srv://..." --out=/backups/$(date +%Y%m%d)
```

## Scaling

### Backend (Railway)

- Upgrade Railway plan for more resources
- Add Redis for session management (future)
- Consider load balancing (future)

### Frontend (Netlify)

- Automatic CDN distribution
- Automatic scaling
- No configuration needed

## Cost Estimates

- **Railway**: $5-20/month (depends on usage)
- **Netlify**: Free tier sufficient for small teams, $19/month for pro
- **MongoDB Atlas**: Free tier (M0) or $9/month (M2)

**Total**: $0-50/month depending on scale

## Support

For issues or questions:
- Check Railway logs
- Check Netlify deploy logs
- Review MongoDB Atlas metrics
- Check application logs

---

**Generated with Claude Code**
