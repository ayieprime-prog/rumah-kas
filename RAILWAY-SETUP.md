# Railway Setup Guide — Development & Production

Panduan lengkap untuk setup RumahKas di Railway dengan dua environment terpisah (development & production).

## 📋 Prerequisites

- GitHub account dengan akses ke `ayieprime-prog/rumah-kas`
- Railway account (https://railway.app)
- Logged in ke Railway dengan GitHub

## 🔧 Setup Development Environment

### Step 1: Create Development Project

1. Buka https://railway.app → **New Project**
2. Pilih **"Deploy from GitHub repo"**
3. Cari dan pilih `ayieprime-prog/rumah-kas`
4. Railway akan mulai deploy dari `master` branch

### Step 2: Configure GitHub Integration (untuk branch develop)

1. Di Railway Project, klik **Settings** (gear icon)
2. Cari **GitHub Integration**
3. Ubah branch menjadi **`develop`**
4. Enable **"Auto Deploy"** ✅
5. Save

### Step 3: Add PostgreSQL Database

1. Klik **"+ New"** atau **"Create"**
2. Pilih **"Database"** → **"Add PostgreSQL"**
3. Railway akan auto-generate database dan `DATABASE_URL`
4. Database akan ter-create otomatis

### Step 4: Set Environment Variables (Development)

1. Klik service aplikasi (bukan PostgreSQL)
2. Buka tab **"Variables"**
3. Add variables:

| Nama | Nilai | Keterangan |
|------|-------|-----------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Railway auto-link |
| `NODE_ENV` | `development` | Development mode |
| `JWT_SECRET` | `dev-secret-32chars-minimal` | Boleh sederhana untuk dev |
| `JWT_EXPIRES_IN` | `12h` | Token validity |
| `CORS_ORIGIN` | `https://rumah-kas-dev.up.railway.app` | Railway dev domain |
| `API_BASE_URL` | `https://rumah-kas-dev.up.railway.app` | API URL |
| `LOG_LEVEL` | `debug` | Verbose logging |

### Step 5: Deploy & Get Domain

1. Tunggu build selesai (lihat Deployments tab)
2. Setelah sukses, buka tab **Settings** → **Networking**
3. Klik **"Generate Domain"**
4. Railway akan memberi domain: `https://rumah-kas-dev.up.railway.app`

✅ **Development Environment siap!** Test di domain yang di-generate

---

## 🎯 Setup Production Environment

### Step 1: Create Production Project (BARU)

1. Buka https://railway.app → **New Project** (jangan di project yang sama!)
2. Pilih **"Deploy from GitHub repo"**
3. Pilih repo yang sama `ayieprime-prog/rumah-kas`
4. Railway akan mulai deploy

### Step 2: Configure GitHub Integration (branch main)

1. Di Railway Project settings, klik **GitHub Integration**
2. Ubah branch menjadi **`main`** (atau `master` kalau masih pakai master)
3. Enable **"Auto Deploy"** ✅
4. Save

⚠️ **PENTING:** Production menggunakan branch yang BERBEDA dengan development!

### Step 3: Add PostgreSQL Database (TERPISAH dari dev!)

1. Klik **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway akan create DATABASE BARU (terpisah dari dev)
3. Catat `DATABASE_URL` yang di-generate

❗ **Critical:** Setiap environment HARUS punya database sendiri!

### Step 4: Set Environment Variables (Production)

1. Klik service aplikasi
2. Buka tab **"Variables"**
3. Add variables:

| Nama | Nilai | Keterangan |
|------|-------|-----------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | HARUS database prod-nya! |
| `NODE_ENV` | `production` | Production mode |
| `JWT_SECRET` | `[Generate 32+ random chars]` | ⚠️ HARUS complex & random! |
| `JWT_EXPIRES_IN` | `12h` | Token validity |
| `CORS_ORIGIN` | `https://rumah-kas-production.up.railway.app` | Production domain |
| `API_BASE_URL` | `https://rumah-kas-production.up.railway.app` | Production API URL |
| `LOG_LEVEL` | `warn` | Minimal logging (only errors) |

### Step 5: Deploy & Get Production Domain

1. Tunggu build selesai
2. Tab **Settings** → **Networking** → **"Generate Domain"**
3. Railway memberi domain: `https://rumah-kas-production.up.railway.app`

✅ **Production Environment siap!** Live aplikasi Anda

---

## 🔑 Generate Secure JWT_SECRET

Untuk production, **HARUS** gunakan random string yang kuat:

### Option 1: 1Password Generator
1. Buka https://1password.com/password-generator/
2. Pilih "Random String"
3. Set length: **32+ characters**
4. Generate → copy
5. Paste ke Railway Variables

### Option 2: Command Line
```bash
# macOS/Linux
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

**NEVER** copy JWT_SECRET ke git atau file lokal!

---

## 🔄 Deployment Flow Setup

### Development Flow
```
Push to develop branch
        ↓
GitHub webhook → Railway dev
        ↓
Auto-build & deploy
        ↓
Test di rumah-kas-dev.up.railway.app
```

### Production Flow
```
Merge PR: develop → main
        ↓
Push to main branch
        ↓
GitHub webhook → Railway prod
        ↓
Auto-build & deploy
        ↓
LIVE di rumah-kas-production.up.railway.app
```

---

## 📊 Verify Setup

### Check Development Environment
1. Buka https://rumah-kas-dev.up.railway.app
2. Lihat halaman login ✅
3. Coba register akun test
4. Lihat dashboard (jika berhasil)

### Check Production Environment
1. Buka https://rumah-kas-production.up.railway.app
2. Lihat halaman login ✅
3. **JANGAN test disini** sampai stable

### Check Database Connection
Di Railway, setiap project:
1. Klik Postgres service
2. Buka tab **"Logs"**
3. Lihat connection logs (harus ada koneksi aktif)

---

## 🚨 Troubleshooting

### Build Gagal di Salah Satu Environment
1. Buka **Deployments** → klik deployment yang failed
2. Baca error message di logs
3. Perbaiki di code → push branch yang sesuai (develop atau main)
4. Auto-deploy akan trigger otomatis

### DATABASE_URL Error
❌ **Problem:** `DATABASE_URL` not found
✅ **Solution:**
1. Pastikan PostgreSQL sudah di-add di project
2. Refresh Variables tab di Railway
3. `DATABASE_URL` harus muncul otomatis
4. Verifikasi variable name persis: `DATABASE_URL` (case-sensitive)

### Different Data di Dev vs Prod
✅ **Expected!** Mereka punya database terpisah.
- Dev database untuk testing (boleh di-reset/delete)
- Prod database untuk real users (BACKUP REGULARLY!)

### Cannot Access Domain
1. Tunggu DNS propagation (bisa sampai 5 menit)
2. Refresh browser
3. Clear cache (Ctrl+Shift+Delete)
4. Cek domain di Railway Settings → Networking

---

## 📝 Important Notes

### Do's ✅
- ✅ Keep dev & prod database SEPARATE
- ✅ Use different JWT_SECRET for dev & prod
- ✅ Test thoroughly di dev sebelum prod
- ✅ Keep JWT_SECRET di Railway Variables (not git)
- ✅ Enable Auto-Deploy untuk CI/CD
- ✅ Monitor logs regularly

### Don'ts ❌
- ❌ DON'T use same database untuk dev & prod
- ❌ DON'T commit .env files ke git (use .env.example only)
- ❌ DON'T share JWT_SECRET di chat/email
- ❌ DON'T test payments di production
- ❌ DON'T delete production database without backup
- ❌ DON'T merge unfinished features ke main

---

## 🎯 Next Steps

1. ✅ Setup dev & prod environments di Railway
2. ✅ Verify semua domain accessible
3. ✅ Test registration & login di dev
4. ✅ Create test data di dev
5. ✅ Dokumentasikan domain links
6. ⏳ Expand fitur-fitur (expenses, budget, dll)

---

## 📞 Reference

- Railway Docs: https://docs.railway.app
- GitHub Integration: https://docs.railway.app/guides/github
- PostgreSQL Setup: https://docs.railway.app/databases/postgresql

🚀 **RumahKas adalah SaaS production-ready!**
