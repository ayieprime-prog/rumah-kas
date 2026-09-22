# Pundi Railway Deployment — Quick Checklist

**Tujuan:** Quick reference untuk deploy dev & prod environments ke Railway.

---

## 🚀 5-Minute Quick Start (First Time Only)

### Prerequisites:
- [ ] Railway.app account (login dengan GitHub)
- [ ] GitHub repo: `ayieprime-prog/rumah-kas`

---

## ⚙️ DEVELOPMENT Environment Setup

### 1️⃣ Create Project
```
Railway Dashboard → "New Project" → "Deploy from GitHub repo" 
→ Select "ayieprime-prog/rumah-kas"
```
- [ ] Project created & auto-deploying

### 2️⃣ Rename Project
```
Settings → Project Name → "Pundi-Dev" → Save
```
- [ ] Project renamed

### 3️⃣ Add Database
```
"+ New" → "Database" → "Add PostgreSQL"
```
- [ ] PostgreSQL created & `DATABASE_URL` auto-generated

### 4️⃣ Configure Backend Service Variables

Click service "rumah-kas" → "Variables" → Add:

| Key | Value | Example |
|-----|-------|---------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Auto |
| `NODE_ENV` | `development` | — |
| `JWT_SECRET` | Generate random 32+ chars | `aB3xY9zK2...` |
| `JWT_EXPIRES_IN` | `12h` | — |
| `CORS_ORIGIN` | `http://localhost:3000,https://rumah-kas-dev.up.railway.app` | — |

- [ ] All variables set
- [ ] Build triggered automatically
- [ ] Deployments tab shows ✅ Success

### 5️⃣ Get Dev URL
```
Backend service → Settings → Networking → "Generate Domain"
```
Copy: `https://rumah-kas-xxx.up.railway.app`

- [ ] Dev Backend URL copied to notes
  - URL: `_______________________________`

---

## ⚙️ PRODUCTION Environment Setup

### 1️⃣ Create Project
```
Railway Dashboard → "New Project" → "Deploy from GitHub repo" 
→ Select "ayieprime-prog/rumah-kas" (same repo)
```
- [ ] New project created

### 2️⃣ Rename Project
```
Settings → Project Name → "Pundi-Production" → Save
```
- [ ] Project renamed

### 3️⃣ Add Database
```
"+ New" → "Database" → "Add PostgreSQL" 
(This is SEPARATE from dev database)
```
- [ ] PostgreSQL created & `DATABASE_URL` auto-generated

### 4️⃣ Configure Backend Service Variables

Click service "rumah-kas" → "Variables" → Add:

| Key | Value | Example |
|-----|-------|---------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Auto (different from dev) |
| `NODE_ENV` | `production` | — |
| `JWT_SECRET` | Generate DIFFERENT random 32+ chars | `xK9pL2mN8...` |
| `JWT_EXPIRES_IN` | `24h` | — |
| `CORS_ORIGIN` | `https://rumah-kas.up.railway.app,https://rumahkas.id` | No localhost! |
| `LOG_LEVEL` | `info` | — |

- [ ] All variables set (JWT_SECRET different from dev!)
- [ ] Build triggered automatically
- [ ] Deployments tab shows ✅ Success

### 5️⃣ Get Prod URL
```
Backend service → Settings → Networking → "Generate Domain"
```
Copy: `https://rumah-kas-xxx.up.railway.app`

- [ ] Prod Backend URL copied to notes
  - URL: `_______________________________`

---

## 🧪 Testing & Verification

### Dev Environment Test
```bash
# 1. Backend health check
curl https://rumah-kas-dev.up.railway.app/api/auth/register

# 2. Test register (should work or return validation error, not 500)
curl -X POST https://rumah-kas-dev.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"householdName":"Test","fullName":"Test User","email":"test@example.com","password":"Test123!"}'

# Expected: 201 Created or validation error (not 500/502)
```

- [ ] Backend dev responds (no 502/503 errors)
- [ ] API endpoints reachable

### Frontend Local Test
```bash
cd frontend
npm install
npm run dev
# Opens http://localhost:3000
```

**Update env file:**
- Create `frontend/.env.local` atau edit vite.config.js
- Set: `VITE_API_URL=https://rumah-kas-dev.up.railway.app`

**Test flow:**
- [ ] Frontend loads (no network errors)
- [ ] Can register new account
- [ ] Can login with that account
- [ ] Dashboard loads with stats

### Prod Environment Test
- [ ] Same test as Dev but with Prod URLs
- [ ] Different test email (avoid mixing dev & prod data)
- [ ] Verify data isolated from dev

---

## 🔐 Security Checklist

Before go-live:

- [ ] `JWT_SECRET` dev & prod are DIFFERENT
- [ ] No `.env` files committed to git
- [ ] `CORS_ORIGIN` only allows intended URLs (no wildcard `*`)
- [ ] `NODE_ENV` set correctly (dev vs prod)
- [ ] Helmet middleware enabled (already in code)
- [ ] Rate limiting enabled (already in code)
- [ ] Database backups setup (Railway auto-backup? Check settings)

---

## 🚨 Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| **502/503 Error** | Check Deployments log. If running OK, try refresh. If error persists: check Variables (especially DATABASE_URL). |
| **DATABASE_URL not set** | In Variables tab, add exactly: `${{Postgres.DATABASE_URL}}`. Wait 30s for rebuild. |
| **Frontend can't connect to backend** | Check VITE_API_URL/REACT_APP_API_URL points to correct Railway URL. Check CORS_ORIGIN includes frontend URL. |
| **Build takes 10+ minutes** | Normal for first deploy. Subsequent deploys faster. If stuck >15min, check logs. |
| **Port already in use** | Don't set PORT variable. Railway manages it automatically. |
| **Prisma migration error** | Check startup logs. Should see "Prisma schema synced". If error: check DATABASE_URL is valid. |
| **JWT errors at login** | JWT_SECRET in Variables might be wrong or empty. Generate new random string & re-set. |

---

## 📞 After Deployment

### Day 1:
- [ ] Monitor Railway logs for errors
- [ ] Check both dev & prod URLs accessible
- [ ] Test register/login flows work

### Week 1:
- [ ] User (spouse) tests on real device
- [ ] Collect feedback & bug reports
- [ ] Fix critical bugs
- [ ] Redeploy with fixes (auto-deploys on git push)

### Ongoing:
- [ ] Check Railway Deployments tab weekly for any failed deploys
- [ ] Monitor logs for uncaught errors
- [ ] Plan next features (Expense tracking, etc)

---

## 🎯 Dev & Prod URLs (Save These)

```
🔵 DEVELOPMENT
Backend: https://rumah-kas-dev.up.railway.app
Frontend: http://localhost:3000 (local during dev)
Database: PostgreSQL (Railway managed)

🔴 PRODUCTION  
Backend: https://rumah-kas.up.railway.app
Frontend: [To be deployed on Netlify/Vercel]
Database: PostgreSQL (Railway managed, separate from dev)
```

---

## 🔗 Related Docs

- **Full Setup Guide:** See `RAILWAY-SETUP.md` for detailed instructions
- **User Testing:** See `USER-TESTING-GUIDE.md` for UAT procedures
- **Local Development:** See `DEVELOPMENT-WORKFLOW.md` for git workflow
- **Cloud Quick Start:** See `PANDUAN-CLOUD.md` for Indonesian quick guide

---

**Status: Ready to Deploy! 🚀**

Last Updated: 2024-09-21
