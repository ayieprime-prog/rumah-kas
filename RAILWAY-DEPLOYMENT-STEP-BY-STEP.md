# Railway Deployment — Step-by-Step Guide
## RumahKas Development & Production Setup

Panduan ini memandu Anda melalui deployment dev & prod ke Railway. **Estimasi waktu: 20 menit per environment.**

---

## ✅ CHECKLIST — SEBELUM MULAI

Pastikan Anda punya:
- [ ] GitHub account (ayieprime-prog)
- [ ] Railway account (https://railway.app)
- [ ] Logged in ke Railway
- [ ] Repository sudah di-push ke GitHub (`ayieprime-prog/rumah-kas`)
- [ ] `develop` branch dan `main` branch exist di GitHub

**Verify branches exist:**
```bash
git branch -a
# Output should show: develop, main/master
```

---

## 🟢 PART 1: SETUP DEVELOPMENT ENVIRONMENT

### Step 1.1: Create Railway Development Project

1. Buka https://railway.app
2. Di dashboard, klik **"+ New Project"** (atau "Create Project")
3. Pilih **"Deploy from GitHub repo"**
4. Search untuk repo: **`ayieprime-prog/rumah-kas`**
5. Click repo untuk select

**Expected:** Railway mulai build dari branch default (biasanya master)

---

### Step 1.2: Configure GitHub Integration (IMPORTANT - switch to develop branch)

Sebelum build selesai, configure agar deploy dari `develop` branch:

1. Di Railway project yang baru, klik **Settings** (gear icon) di sidebar
2. Scroll down ke **"GitHub"** section
3. Klik repo name untuk edit
4. **CHANGE BRANCH**: dari `master` → `develop`
5. Enable **"Auto Deploy"** ✅
6. Click **"Save"** atau confirm

**Expected:** Build akan auto-trigger untuk `develop` branch

---

### Step 1.3: Add PostgreSQL Database

1. Klik **"+ New"** atau **"Create"** button di project
2. Pilih **"Database"**
3. Pilih **"PostgreSQL"** → **"Create"**
4. Railway akan create database otomatis

**Expected:** Database selesai dalam 1-2 menit. Anda akan lihat service "Postgres" di project.

**Important:** Copy `DATABASE_URL` yang akan di-generate (kita pakai di step berikutnya)

---

### Step 1.4: Set Environment Variables (Development)

1. Di project, klik service **aplikasi** (bukan Postgres)
2. Buka tab **"Variables"**
3. Add variables satu per satu dengan klik **"New Variable"**:

**Variable 1:**
```
Name: DATABASE_URL
Value: ${{Postgres.DATABASE_URL}}
```
Click "Add"

**Variable 2:**
```
Name: NODE_ENV
Value: development
```
Click "Add"

**Variable 3:**
```
Name: JWT_SECRET
Value: dev-secret-key-12345678901234567890
```
(Ini boleh sederhana untuk dev. Nanti ganti untuk prod)
Click "Add"

**Variable 4:**
```
Name: JWT_EXPIRES_IN
Value: 12h
```
Click "Add"

**Variable 5:**
```
Name: CORS_ORIGIN
Value: https://rumah-kas-dev.up.railway.app
```
Click "Add"

**Variable 6:**
```
Name: API_BASE_URL
Value: https://rumah-kas-dev.up.railway.app
```
Click "Add"

**Variable 7:**
```
Name: LOG_LEVEL
Value: debug
```
Click "Add"

**Expected:** Semua 7 variables sudah di-set. Railway akan otomatis re-build karena variables berubah.

---

### Step 1.5: Wait for Build to Complete

1. Buka tab **"Deployments"**
2. Lihat deployment yang sedang running (ada status "Building" atau "Deploying")
3. **Tunggu sampai status berubah menjadi "Deployed" (SUCCESS)** ✅

**Tips troubleshooting:**
- Kalau status "Failed" → click deployment untuk lihat logs
- Error umum: `Database not ready` (tunggu 30 detik, auto-retry)
- Kalau stuck: click "Redeploy" button

**Expect:** Build selesai dalam 3-5 menit

---

### Step 1.6: Generate Domain (Dapatkan URL public)

Setelah deployment sukses:

1. Masih di aplikasi service, buka tab **"Settings"**
2. Scroll ke section **"Networking"**
3. Klik **"Generate Domain"** button
4. Railway akan generate domain seperti: `https://rumah-kas-dev-production.up.railway.app` (atau similar)

**Copy domain ini!** Contoh: `https://rumah-kas-dev.up.railway.app`

**Expected:** Domain sudah live & accessible

---

### Step 1.7: Test Development Environment ✅

1. Buka domain di browser (contoh: https://rumah-kas-dev.up.railway.app)
2. Lihat halaman login ✅
3. **Test Registration:**
   - Click "Daftar di sini"
   - Isi form:
     - Nama Keluarga: "Keluarga Test Dev"
     - Nama Lengkap: "Test Admin"
     - Email: "admin@dev.test"
     - Password: "TestPassword123!"
   - Click "Daftar"
   - Seharusnya berhasil & redirect ke dashboard ✅

4. **Lihat Dashboard:**
   - Harus muncul stats cards (Total Income, Total Expense, Balance, Total Debt)
   - Harus ada chart placeholder (jika ada dummy data)
   - Seharusnya tidak ada error di console browser

**If berhasil:** ✅ Development environment READY!

**If gagal:** Lihat browser console (F12) untuk error message, atau cek Railway logs

---

## 🔴 PART 2: SETUP PRODUCTION ENVIRONMENT

### Step 2.1: Create SECOND Railway Project (PENTING: TERPISAH dari dev!)

1. Buka https://railway.app (dashboard)
2. Klik **"+ New Project"** (BARU, jangan di project dev yang sama!)
3. Pilih **"Deploy from GitHub repo"**
4. Search & select: **`ayieprime-prog/rumah-kas`** (repo yang sama)

**Expected:** Railway mulai build repository

---

### Step 2.2: Configure GitHub Integration (untuk main branch)

1. Di Railway project baru ini, klik **Settings**
2. Scroll ke **"GitHub"** section
3. Edit branch: dari `master` → `main` (atau `master` kalau masih pakai itu)
4. Enable **"Auto Deploy"** ✅
5. Save

**Critical:** Production harus dari branch yang berbeda (main, bukan develop)

---

### Step 2.3: Add PostgreSQL Database (TERPISAH dari dev!)

1. Klik **"+ New"** → **"Database"** → **"PostgreSQL"** → **"Create"**
2. **PENTING:** Ini akan create DATABASE BARU yang terpisah dari dev!

**Expected:** Database siap dalam 1-2 menit

**Verify:** DATABASE_URL baru akan di-generate (berbeda dari dev)

---

### Step 2.4: Set Environment Variables (Production)

1. Di aplikasi service, buka tab **"Variables"**
2. Add variables (COPY-PASTE dari bawah, ATAU type manually):

```
DATABASE_URL = ${{Postgres.DATABASE_URL}}
NODE_ENV = production
JWT_SECRET = [GENERATE RANDOM STRONG PASSWORD - LIHAT STEP BERIKUTNYA]
JWT_EXPIRES_IN = 12h
CORS_ORIGIN = https://rumah-kas-production.up.railway.app
API_BASE_URL = https://rumah-kas-production.up.railway.app
LOG_LEVEL = warn
```

---

### Step 2.4b: Generate Strong JWT_SECRET untuk Production ⚠️

**CRITICAL:** Production HARUS pakai JWT_SECRET yang KUAT & RANDOM

**Option 1: Pakai Online Generator (Recommended)**
1. Buka https://1password.com/password-generator/
2. Pilih **"Random String"**
3. Set length: **32 characters**
4. Click "Generate"
5. Copy hasil
6. Paste ke Railway variable `JWT_SECRET`

**Option 2: Command Line (macOS/Linux)**
```bash
openssl rand -base64 32
# Copy output, paste ke Railway
```

**Option 3: PowerShell (Windows)**
```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
# Copy output, paste ke Railway
```

**Expected:** `JWT_SECRET` adalah string random 32+ chars yang TIDAK ada di git atau file lain

---

### Step 2.5: Wait for Build (Production)

1. Buka tab **"Deployments"**
2. Wait untuk status "Deployed" ✅

**Expect:** 3-5 menit build

---

### Step 2.6: Generate Production Domain

1. Buka tab **"Settings"** → **"Networking"**
2. Click **"Generate Domain"**
3. Copy domain (contoh: `https://rumah-kas-production.up.railway.app`)

**Expected:** Production domain sudah live

---

### Step 2.7: Test Production Environment ✅

1. Buka domain production di browser
2. Lihat halaman login ✅
3. **Test Registration:**
   - Isi form (different email dari dev test)
   - Click "Daftar"
   - Seharusnya berhasil ✅
4. **Verify Dashboard works** ✅

**If berhasil:** ✅ Production environment READY!

---

## 📋 VERIFICATION CHECKLIST

Setelah semua selesai, verify:

### Development Environment
- [ ] Domain accessible (https://rumah-kas-dev.up.railway.app)
- [ ] Login page muncul
- [ ] Bisa register akun
- [ ] Dashboard muncul dengan data
- [ ] Tidak ada 500 error di console

### Production Environment
- [ ] Domain accessible (https://rumah-kas-production.up.railway.app)
- [ ] Login page muncul
- [ ] Bisa register akun
- [ ] Dashboard muncul dengan data
- [ ] Tidak ada 500 error di console

### Database Verification
- [ ] Dev & Prod databases TERPISAH (verify via DATABASE_URL berbeda)
- [ ] Data di dev ≠ data di prod (create user di dev, tidak muncul di prod)
- [ ] Tidak ada error "database connection" di logs

### Auto-Deploy Verification
1. **For Dev:** Push commit ke `develop` branch:
   ```bash
   git checkout develop
   git pull origin develop
   git add .
   git commit -m "test: verify auto-deploy"
   git push origin develop
   ```
   Seharusnya Railway auto-trigger build untuk dev dalam 1-2 menit

2. **For Prod:** Push commit ke `main` branch:
   ```bash
   git checkout main
   git pull origin main
   git merge develop  # (atau cherry-pick commit)
   git push origin main
   ```
   Seharusnya Railway auto-trigger build untuk prod dalam 1-2 menit

---

## 🔗 SAVE THESE URLS

**Development:**
```
URL: https://rumah-kas-dev.up.railway.app
Branch: develop
Database: PostgreSQL (dev)
```

**Production:**
```
URL: https://rumah-kas-production.up.railway.app
Branch: main
Database: PostgreSQL (prod)
Status: READY FOR SOFT-LAUNCH
```

---

## ❌ TROUBLESHOOTING

### "Database connection refused"
**Problem:** DATABASE_URL variable salah atau database belum siap
**Solution:**
1. Refresh Variables tab di Railway
2. DATABASE_URL seharusnya ada (auto-generated oleh Railway)
3. Jika masih tidak ada: delete Postgres, create baru
4. Wait 30 detik, redeploy

### "Cannot connect to https://rumah-kas-dev.up.railway.app"
**Problem:** Domain belum propagate atau build masih running
**Solution:**
1. Verify deployment status = "Deployed"
2. Wait 1-2 menit untuk DNS propagate
3. Clear browser cache (Ctrl+Shift+Delete)
4. Try incognito/private window

### "Login page shows but can't register"
**Problem:** Backend tidak connect ke database
**Solution:**
1. Check Railway logs: Click deployment → "Logs"
2. Look for error messages starting with "Error" atau "ECONNREFUSED"
3. If DATABASE_URL issue: fix environment variable
4. Redeploy

### "Registered di dev tapi bisa juga login di prod"
**Problem:** Data di dev & prod menggunakan database yang sama (NOT GOOD!)
**Solution:** 
1. This should NOT happen (kita create 2 databases terpisah)
2. If it happened: Delete prod database
3. Create NEW PostgreSQL di prod project
4. Update DATABASE_URL variable di prod
5. Redeploy

---

## ✅ NEXT STEPS (After Deployment Success)

1. ✅ Confirm both environments working
2. 📝 START PHASE 2: Build Expenses & Income pages
3. 📝 Test new features in dev first
4. 📝 Merge to main & deploy to prod
5. 📝 Continue with other features

---

**🎉 Deployment done! Ready for feature development!**

Kapan Anda selesai dengan deployment, lapor ke Claude:
- Dev URL berhasil?
- Prod URL berhasil?
- Bisa register & login di keduanya?

Kemudian kita lanjut ke **Phase 2: Expenses & Income Pages!**
