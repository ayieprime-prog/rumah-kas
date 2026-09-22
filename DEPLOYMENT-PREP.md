# Rumah Kas — Deployment Preparation Checklist

**Status:** ✅ Ready for Railway Deployment  
**Track:** Parallel with Phase C development  
**Target:** Production go-live (Phase B.1-B.4)

---

## 🎯 Two Parallel Tracks

### Track A: Deployment (master branch)
```
Production deployment to Railway
├── Dev environment setup
├── Prod environment setup
├── Developer testing (Phase 1)
├── Spouse UAT (Phase 2)
├── Bug fixes & iteration
└── Go-live
```

### Track B: Development (phase-c-features branch)
```
Phase C feature development
├── C.1 - Reports & PDF Export
├── C.2 - Sync & Offline Mode
├── C.3 - Mobile UX
├── C.4 - Bank Integration
└── C.5 - Notifications
```

**Key:** Master stays stable for deployment. Phase C development happens on separate branch. No conflicts.

---

## 📋 TRACK A: Production Deployment

### Step 1: Pre-Deployment Verification ✅

- [ ] All Phase B code merged to master
- [ ] No uncommitted changes
  ```bash
  git status  # Should show "working tree clean"
  ```
- [ ] Last commit documented
  ```bash
  git log --oneline -1
  # Should show: 590fa89 Phase B.4 Backend & Frontend: Advanced Budget Analytics
  ```
- [ ] Build works locally
  ```bash
  npm run build
  ```

**Status:** ✅ COMPLETE

---

### Step 2: Railway Setup — Development Environment (15 min)

Follow: [RAILWAY-DEPLOYMENT-CHECKLIST.md](./RAILWAY-DEPLOYMENT-CHECKLIST.md)

- [ ] Create Railway account (if not exists)
- [ ] Create new project "rumah-kas-dev"
- [ ] Connect to GitHub repo
- [ ] Add PostgreSQL database
- [ ] Configure environment variables for DEV:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `JWT_SECRET` | `[random-32-char-string-dev]` |
| `JWT_EXPIRES_IN` | `12h` |
| `CORS_ORIGIN` | `https://[dev-domain].railway.app` |

- [ ] Wait for build to complete
- [ ] Generate public domain
- [ ] Test health endpoint: `GET /api/health`

**Expected Output:**
```
{
  "ok": true
}
```

**Status:** ⏳ TODO

---

### Step 3: Railway Setup — Production Environment (15 min)

- [ ] Create new project "rumah-kas-prod"
- [ ] Connect to GitHub repo (same as dev)
- [ ] Add PostgreSQL database (separate from dev)
- [ ] Configure environment variables for PROD:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `JWT_SECRET` | `[random-32-char-string-PROD]` ⚠️ DIFFERENT FROM DEV |
| `JWT_EXPIRES_IN` | `12h` |
| `CORS_ORIGIN` | `https://[prod-domain].railway.app` |
| `NODE_ENV` | `production` |

⚠️ **IMPORTANT:** Prod JWT_SECRET MUST be different from dev!

- [ ] Wait for build to complete
- [ ] Generate public domain
- [ ] Test health endpoint

**Status:** ⏳ TODO

---

### Step 4: Backend Testing (10 min each environment)

**For both dev and prod, test these endpoints:**

#### Health & Status
```bash
curl https://[dev-domain].railway.app/api/health
# Expected: {"ok": true}
```

#### Auth - Register
```bash
curl -X POST https://[dev-domain].railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!","name":"Test User"}'
# Expected: { "user": {...}, "token": "..." }
```

#### Auth - Login
```bash
curl -X POST https://[dev-domain].railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}'
# Expected: { "user": {...}, "token": "..." }
```

#### Dashboard (need valid token from login)
```bash
curl https://[dev-domain].railway.app/api/dashboard \
  -H "Authorization: Bearer [token-from-login]"
# Expected: { "overview": {...}, "wallets": [...], ... }
```

**Status:** ⏳ TODO

---

### Step 5: Frontend Testing — Local Dev Environment (20 min)

```bash
# Clone fresh or use existing repo
cd frontend

# Install dependencies
npm install

# Create .env.local with dev backend URL
echo "VITE_API_URL=https://[dev-domain].railway.app" > .env.local

# Start frontend dev server
npm run dev

# Open http://localhost:5173 in browser
```

**Test Cases:**
- [ ] Register page loads
- [ ] Register new account (use test email)
- [ ] Login with new account
- [ ] Dashboard displays (should show 0 data initially)
- [ ] Click through main navigation (Keuangan, Kalender, Berdua, etc)
- [ ] Create expense
- [ ] Create income
- [ ] Add wallet
- [ ] Navigate to Assets, Budget, Goals pages
- [ ] Logout & verify redirect

**Status:** ⏳ TODO

---

### Step 6: Phase 1 Developer Testing (1 hour)

Follow: [USER-TESTING-GUIDE.md](./USER-TESTING-GUIDE.md) → Phase 1

**Test Scenarios:**
1. Register & Login flow (5 min)
2. Dashboard comprehension (10 min)
3. Navigation all menu items (10 min)
4. Create: expense, income, budget, goal, wallet (15 min)
5. Edit & Delete operations (10 min)
6. Responsive design (tablet & mobile view) (10 min)
7. Error handling (invalid inputs, network errors) (5 min)

**Document any bugs found:**
- [ ] Bug #1: [description]
- [ ] Bug #2: [description]
- [ ] etc.

**Status:** ⏳ TODO

---

### Step 7: Phase 2 Spouse UAT (1-2 hours)

Follow: [USER-TESTING-GUIDE.md](./USER-TESTING-GUIDE.md) → Phase 2

**Brief spouse on:**
- What app does
- How to register
- How to navigate
- What to test

**Let spouse test for:**
- Register & login
- Dashboard comprehension
- Add some data (expenses, income)
- Navigate around
- General UX impressions

**Collect feedback:**
- [ ] Is it intuitive?
- [ ] Any confusing parts?
- [ ] Missing features?
- [ ] Would you use this?
- [ ] Bugs found?

**Status:** ⏳ TODO

---

### Step 8: Bug Fixes & Iteration

**For each bug found:**

1. **Categorize by severity:**
   - 🔴 Critical: Crash, data loss, can't complete flow
   - 🟠 High: Feature broken but workaround exists
   - 🟡 Medium: UI/UX issue
   - 🟢 Low: Typo, spacing, non-essential

2. **Fix in priority order:**
   - Critical bugs: MUST fix before go-live
   - High bugs: SHOULD fix before go-live
   - Medium bugs: Nice to have
   - Low bugs: Can fix post-launch

3. **For each fix:**
   ```bash
   git checkout -b bugfix/[bug-description]
   # Make fix
   git add .
   git commit -m "Fix: [bug description]"
   git push origin bugfix/[bug-description]
   # Create PR to master
   # Merge after testing
   ```

4. **Re-deploy:** Railway auto-deploys when pushed to master
5. **Re-test:** Verify fix works in dev environment
6. **Repeat:** Until all critical/high bugs fixed

**Status:** ⏳ TODO

---

### Step 9: Production Validation

Before flipping switch to production:

- [ ] Dev environment fully tested & bug-free
- [ ] Prod environment builds successfully
- [ ] Both databases contain seed data (admin user, etc)
- [ ] JWT_SECRETs are different (dev vs prod)
- [ ] CORS_ORIGIN points to correct domains
- [ ] Health endpoints respond
- [ ] Can login to prod environment
- [ ] Dashboard loads in prod
- [ ] No console errors in dev tools
- [ ] Mobile responsiveness verified

**Status:** ⏳ TODO

---

### Step 10: Go-Live 🚀

- [ ] Announce to spouse that app is live
- [ ] Share production URL
- [ ] Have spouse register & login to prod
- [ ] Give quick orientation on production app
- [ ] Keep dev environment live for bug fixes if needed
- [ ] Monitor for issues first 24-48 hours

**Production URLs:**
- Dev: `https://[dev-domain].railway.app`
- Prod: `https://[prod-domain].railway.app`

**Status:** ⏳ TODO

---

## 📋 TRACK B: Phase C Development

- [ ] Branch `phase-c-features` created ✅
- [ ] PHASE-C-ROADMAP.md created ✅
- [ ] Ready to start C.1 (Reports & PDF)

**Status:** Ready to begin

---

## ⚡ Quick Reference

### Critical Environment Variables

**DEV:**
```
DATABASE_URL=[from Railway PostgreSQL]
JWT_SECRET=[random-dev]
CORS_ORIGIN=https://[dev-domain].railway.app
```

**PROD:**
```
DATABASE_URL=[separate from dev]
JWT_SECRET=[random-prod, DIFFERENT]
CORS_ORIGIN=https://[prod-domain].railway.app
NODE_ENV=production
```

### Testing Endpoints

```bash
# Health check (no auth needed)
curl https://[domain]/api/health

# Register
curl -X POST https://[domain]/api/auth/register

# Login
curl -X POST https://[domain]/api/auth/login

# Dashboard (needs auth token)
curl -H "Authorization: Bearer [token]" https://[domain]/api/dashboard
```

### Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Build timeout | Check logs, might be installing deps |
| DATABASE_URL not found | Add to Variables in Railway dashboard |
| CORS error | Check CORS_ORIGIN matches frontend domain |
| Auth failing | Verify JWT_SECRET is set |
| Logout not working | Check cookie settings, might need HTTPS |

---

## 📚 Documentation

- [RAILWAY-DEPLOYMENT-CHECKLIST.md](./RAILWAY-DEPLOYMENT-CHECKLIST.md) — Detailed deployment steps
- [RAILWAY-SETUP.md](./RAILWAY-SETUP.md) — Railway configuration guide
- [USER-TESTING-GUIDE.md](./USER-TESTING-GUIDE.md) — Testing procedures
- [PHASE-C-ROADMAP.md](./PHASE-C-ROADMAP.md) — Phase C development plan
- [NEXT-STEPS.md](./NEXT-STEPS.md) — Original deployment guide

---

## ✅ Status Summary

| Item | Status | Owner | ETA |
|------|--------|-------|-----|
| Code ready | ✅ Done | N/A | — |
| Dev environment | ⏳ TODO | You | Step 2 |
| Prod environment | ⏳ TODO | You | Step 3 |
| Testing | ⏳ TODO | You | Steps 6-7 |
| Bug fixes | ⏳ TODO | You | Step 8 |
| Go-live | ⏳ TODO | You | Step 10 |
| Phase C dev | ✅ Ready | — | Parallel |

---

## 🚀 Ready to Start?

### Next Action: Go to Step 2

Follow [RAILWAY-DEPLOYMENT-CHECKLIST.md](./RAILWAY-DEPLOYMENT-CHECKLIST.md) for detailed step-by-step instructions on setting up dev environment on Railway.

**Estimated time to go-live:** 4-6 hours (mostly waiting for builds)

---

**Happy deploying! 🎉**

**Questions?** Check the detailed guides linked above. They cover all scenarios.
