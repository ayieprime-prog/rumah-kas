# RumahKas Development Workflow

Dokumen ini menjelaskan workflow pengembangan dengan separation antara **development** dan **production** environment.

## 📋 Environment Overview

### Development Environment
- **Purpose:** Testing, prototyping, dan QA
- **Database:** PostgreSQL di Railway (dev instance)
- **Domain:** `rumah-kas-dev.up.railway.app` (atau custom domain)
- **Branch:** `develop`
- **URL:** https://dev.rumahkas.id (nanti bisa custom)

### Production Environment
- **Purpose:** Live aplikasi untuk end-users
- **Database:** PostgreSQL di Railway (prod instance)
- **Domain:** `rumah-kas-production.up.railway.app` (atau custom)
- **Branch:** `main`/`master`
- **URL:** https://rumahkas.id (atau custom domain)

## 🔄 Git Workflow

### Branch Strategy

```
main (production)
  ├── v1.0.0 (tagged releases)
  ├── v1.0.1 (hotfixes)
  └── v1.1.0

develop (development)
  ├── feature/expenses-tracking
  ├── feature/budget-management
  └── feature/multi-user-sync
```

### Workflow Steps

1. **Development** → Push ke `develop` branch
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/nama-fitur
   # ... edit code ...
   git add .
   git commit -m "feat: deskripsi fitur"
   git push origin feature/nama-fitur
   # Create Pull Request develop → approve → merge
   ```

2. **Testing** → Otomatis deploy ke Railway (dev environment)
   - PR merge ke `develop` → trigger deploy ke dev
   - Testing di https://dev.rumahkas.id

3. **Release** → Merge `develop` ke `main`
   ```bash
   git checkout main
   git pull origin main
   git merge develop
   git tag v1.0.0
   git push origin main --tags
   ```

4. **Production** → Otomatis deploy ke Railway (prod environment)
   - PR merge ke `main` → trigger deploy ke production
   - Live di https://rumahkas.id

## 🚀 Railway Setup (Dua Projects)

### Project 1: rumah-kas-development
- **Name:** rumah-kas-development
- **GitHub Branch:** develop
- **Database:** Postgres (dev)
- **Environment:** development

**Variables:**
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
NODE_ENV=development
JWT_SECRET=[dev-secret-32chars]
JWT_EXPIRES_IN=12h
CORS_ORIGIN=https://dev.rumahkas.id
API_BASE_URL=https://dev.rumahkas.id/api
LOG_LEVEL=debug
```

### Project 2: rumah-kas-production
- **Name:** rumah-kas-production
- **GitHub Branch:** main/master
- **Database:** Postgres (prod)
- **Environment:** production

**Variables:**
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
NODE_ENV=production
JWT_SECRET=[prod-secret-32chars]
JWT_EXPIRES_IN=12h
CORS_ORIGIN=https://rumahkas.id
API_BASE_URL=https://rumahkas.id/api
LOG_LEVEL=warn
SENTRY_DSN=[error-tracking-url]
```

## 📊 Railway Configuration Detail

### Langkah Setup Development Railway Project

1. Buka https://railway.app
2. **New Project** → Deploy from GitHub repo → pilih `ayieprime-prog/rumah-kas`
3. **Configure GitHub Integration:**
   - Pilih branch: `develop`
   - Auto-deploy: Enable
4. **Add PostgreSQL:** Railway akan generate dev database
5. **Set Variables:** (lihat di atas)
6. **Generate Domain:** Akan dapat subdomain dev

### Langkah Setup Production Railway Project

1. Buat project baru lagi: **New Project**
2. **Deploy from GitHub:** Pilih repo yang sama
3. **Configure GitHub:**
   - Pilih branch: `main` (atau master)
   - Auto-deploy: Enable
4. **Add PostgreSQL:** Railway akan generate prod database (TERPISAH dari dev!)
5. **Set Variables:** (lihat di atas, production values)
6. **Generate Domain:** Akan dapat subdomain prod

⚠️ **PENTING:** Pastikan dev dan production menggunakan **database terpisah**!

## 🔐 Security Best Practices

### Development
- `LOG_LEVEL=debug` (untuk debugging)
- JWT_SECRET boleh sederhana (untuk testing)
- Database bisa di-reset (tidak ada data real)
- Email testing bisa fake (test@example.com)

### Production
- `LOG_LEVEL=warn` (hanya error & warnings)
- JWT_SECRET HARUS complex & random 32+ chars
- Database production = BACKUP REGULAR!
- Email HARUS real (send actual emails)
- Enable error tracking (Sentry, etc)
- Enable monitoring & alerts

## 📱 Frontend Configuration

### Development Frontend
```javascript
// frontend/.env.development
VITE_API_URL=http://localhost:5000/api
VITE_ENV=development
```

### Production Frontend
```javascript
// frontend/.env.production
VITE_API_URL=https://rumahkas.id/api
VITE_ENV=production
```

### Update `frontend/src/utils/api.js`:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
export const apiClient = axios.create({
  baseURL: API_URL
})
```

## 🔄 Deployment Flow

```
Developer push code
          ↓
    GitHub Actions (optional)
     (Run tests & linting)
          ↓
    feature branch → develop
    PR → Review → Merge
          ↓
develop branch updated
          ↓
Railway DEV triggered
  (Auto-deploy to dev)
          ↓
Test & QA di dev.rumahkas.id
          ↓
develop → main (Release PR)
PR → Review → Merge
          ↓
main branch updated
          ↓
Railway PROD triggered
  (Auto-deploy to production)
          ↓
LIVE di rumahkas.id ✅
```

## 🧪 Testing Strategy

### Development Environment Testing
- ✅ Unit tests (local + dev)
- ✅ Integration tests
- ✅ Manual testing
- ✅ Load testing (kalau perlu)
- ✅ Use dummy/test data

### Before Production Release
- ✅ Code review (PR)
- ✅ All tests passing
- ✅ Staging/dev fully tested
- ✅ Performance checked
- ✅ Security audit (kalau perlu)
- ✅ Database migration tested
- ✅ Rollback plan ready

## 📋 Release Checklist

Sebelum merge ke `main` untuk production:

- [ ] All features di `develop` sudah tested
- [ ] No breaking changes
- [ ] Database migrations compatible
- [ ] Environment variables di-update (prod values)
- [ ] API documentation updated
- [ ] Version number bumped (semantic versioning)
- [ ] Changelog updated
- [ ] PR review & approved
- [ ] CI/CD tests all passing
- [ ] Rollback plan documented

## 🆘 Troubleshooting

### Dev & Prod Database Tertukar
❌ **Problem:** Keduanya pointing ke database yang sama
✅ **Solution:** 
1. Stop prod deployment
2. Delete database prod di Railway
3. Create new PostgreSQL untuk prod
4. Update `DATABASE_URL` di prod Railway project
5. Re-deploy

### Changes Hanya Muncul di Dev, Tidak di Prod
❌ **Problem:** Lupa merge `develop` → `main`
✅ **Solution:**
1. Pastikan develop sudah stable
2. Create PR develop → main
3. Review & merge
4. Push `main` branch
5. Railway akan auto-deploy

### Rollback Production
Kalau ada issue di production:
```bash
# Revert ke commit sebelumnya
git revert [commit-hash]
git push origin main
# Railway akan auto-deploy versi sebelumnya
```

## 📞 Questions?

Lihat panduan deployment detail di `PANDUAN-CLOUD.md` atau tanya Claude.

---

🏠 **RumahKas Development Workflow**
