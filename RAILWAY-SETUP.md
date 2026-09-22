# Pundi — Railway Deployment Guide (Dev & Production)

Panduan lengkap untuk deploy aplikasi Pundi ke dua environment di Railway: Development dan Production.

---

## 📋 Prerequisites

1. **GitHub Account:** `ayieprime-prog` (dengan akses ke repo `rumah-kas`)
2. **Railway Account:** https://railway.app (login dengan GitHub)
3. **Environment Variables Ready:** Siapkan JWT_SECRET dan konfigurasi lainnya

---

## 🏗️ Arsitektur: Development vs Production

| Aspek | Development | Production |
|-------|-------------|------------|
| **URL** | `https://rumah-kas-dev.up.railway.app` | `https://rumah-kas.up.railway.app` |
| **Database** | PostgreSQL dev instance | PostgreSQL prod instance (terpisah) |
| **Environment** | `NODE_ENV=development` | `NODE_ENV=production` |
| **Frontend URL** | `http://localhost:3000` (local testing) | Production URL |
| **Data** | Test data, seed otomatis | Production data, backup regular |
| **Monitoring** | Basic logs | Enhanced monitoring & alerts |

---

## ✅ Langkah 1: Setup Development Environment (di Railway)

### 1.1 Buat Project Baru

1. Buka https://railway.app
2. Login dengan GitHub (`ayieprime-prog`)
3. Klik **"New Project"** → **"Deploy from GitHub repo"**
4. Pilih repo **`ayieprime-prog/rumah-kas`**
5. Railway akan mulai auto-deploy (tunggu sebentar)

### 1.2 Rename Project ke "Pundi-Dev"

1. Di Railway dashboard, klik project yang baru dibuat
2. Klik ⚙️ **Settings** (di sisi kanan atas)
3. Di bagian **Project Name**, ubah ke `Pundi-Dev`
4. Klik **Save**

### 1.3 Tambah PostgreSQL Database

1. Di dalam project Pundi-Dev, klik **"+ New"** 
2. Pilih **"Database"** → **"Add PostgreSQL"**
3. Tunggu database terbuat (~1 menit)
4. Railway otomatis membuat variabel `DATABASE_URL`

### 1.4 Konfigurasi Backend Service

#### 4.1 Set Environment Variables

1. Klik service **"rumah-kas"** (service backend/utama)
2. Buka tab **"Variables"**
3. Tambahkan variabel berikut (klik **"New Variable"** untuk setiap item):

| Variabel | Nilai | Keterangan |
|----------|-------|-----------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Auto-link ke PostgreSQL |
| `NODE_ENV` | `development` | Development environment |
| `JWT_SECRET` | `[buat_nilai_acak_minimal_32_karakter]` | Gunakan https://1password.com/password-generator/ |
| `JWT_EXPIRES_IN` | `12h` | Token expiry duration |
| `CORS_ORIGIN` | `http://localhost:3000,https://rumah-kas-dev.up.railway.app` | Allowed origins untuk CORS |
| `PORT` | Kosongkan (Railway set otomatis) | — |

**⚠️ PENTING:** 
- Jangan set `PORT` — Railway mengaturnya otomatis
- `JWT_SECRET` hanya di Railway Variables, JANGAN di git
- Gunakan random string yang kuat untuk `JWT_SECRET`

#### 4.2 Tunggu Build & Deploy

1. Buka tab **"Deployments"**
2. Lihat status build (biasanya 2-5 menit)
3. Kalau berhasil → status **"Success"** (hijau)
4. Kalau error → lihat error log → hubungi untuk di-debug

### 1.5 Konfigurasi Frontend Service (Opsional untuk Dev)

Untuk development, frontend bisa dijalankan di local (`npm run dev` di folder `frontend/`). 
Tapi jika ingin deploy frontend ke Railway juga:

1. Di project Pundi-Dev, klik **"+ New"**
2. Pilih **"GitHub repo"** → pilih repo yang sama
3. Railway akan detect bahwa ada folder `frontend/`
4. Konfigurasi:
   - **Root Directory:** `frontend/`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm run preview` atau gunakan static hosting

#### Tambah Environment untuk Frontend:

| Variabel | Nilai | Keterangan |
|----------|-------|-----------|
| `VITE_API_URL` | `https://rumah-kas-dev.up.railway.app` | Backend URL di dev |

### 1.6 Generate Public URL untuk Backend

1. Klik service backend (rumah-kas)
2. Tab **"Settings"** → **"Networking"**
3. Klik **"Generate Domain"** (kalau belum ada)
4. Railway akan memberi URL: `https://rumah-kas-[random].up.railway.app`
5. **Catat URL ini** untuk testing

---

## ✅ Langkah 2: Setup Production Environment

### 2.1 Buat Project Production yang Terpisah

**PENTING:** Production harus di project TERPISAH dari dev, agar:
- Database production tetap aman dari kesalahan dev
- Tidak ada data tercampur
- Scalability terpisah

1. Di Railway dashboard, klik **"New Project"**
2. Pilih **"Deploy from GitHub repo"**
3. Pilih repo **`ayieprime-prog/rumah-kas`** (repo yang sama)
4. Railway akan buat project baru
5. Rename ke **"Pundi-Production"**

### 2.2 Tambah PostgreSQL untuk Production

1. Di project Pundi-Production, klik **"+ New"**
2. Pilih **"Database"** → **"Add PostgreSQL"**
3. Database production terpisah dari development — bagus!

### 2.3 Konfigurasi Backend Production

1. Klik service backend
2. Tab **"Variables"** → tambahkan:

| Variabel | Nilai | Keterangan |
|----------|-------|-----------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Production database |
| `NODE_ENV` | `production` | Production environment |
| `JWT_SECRET` | `[buat_nilai_acak_BERBEDA_dari_dev]` | Random string baru & kuat |
| `JWT_EXPIRES_IN` | `24h` | Lebih lama untuk prod |
| `CORS_ORIGIN` | `https://rumah-kas.up.railway.app,https://rumahkas.id` | Production URLs only |
| `LOG_LEVEL` | `info` | Production logging |

### 2.4 Setup Production Domain

1. Klik service backend
2. Tab **"Settings"** → **"Networking"**
3. Klik **"Generate Domain"**
4. Railway beri URL: `https://rumah-kas-[random].up.railway.app`
5. **Catat URL ini**

### 2.5 Setup Custom Domain (Opsional)

Jika ada domain sendiri (misal: `api.rumahkas.id`):

1. Di sini kita skip untuk sekarang
2. Bisa ditambah nanti setelah live testing

---

## 🧪 Langkah 3: Testing Setup Sebelum Go-Live

### 3.1 Test Backend Development

1. **Ambil Dev Backend URL** dari Railway (dari step 1.6)
2. Buka URL di browser (misal: `https://rumah-kas-xxx.up.railway.app/health` atau route apapun yang ada)
3. Harus dapat response (bukan error 502/503)
4. Test API endpoints:
   ```bash
   # Test Register
   curl -X POST https://rumah-kas-dev.up.railway.app/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"householdName":"Test Keluarga","fullName":"Test User","email":"test@example.com","password":"password123"}'
   
   # Harus dapat response 201 atau error validation (bukan 500)
   ```

### 3.2 Test Frontend Development (Local)

1. Clone atau pull repo ke local
2. Di folder `frontend/`:
   ```bash
   npm install
   npm run dev
   ```
3. Buka `http://localhost:3000`
4. Halaman login harus muncul
5. **Update API URL** di `.env.local` (atau di code):
   - Ganti dari `localhost:5000` ke `https://rumah-kas-dev.up.railway.app`
6. Coba register akun test:
   - Nama Keluarga: `Test Family`
   - Nama Lengkap: `Test User`
   - Email: `test@dev.example.com`
   - Password: `TestPass123!`
7. Klik Register → harus redirect ke login
8. Login dengan email & password tadi → harus masuk ke dashboard
9. **Dashboard harus load** dengan data (stats cards, charts, dll)

### 3.3 Test Production Setup (Dry Run)

1. Pastikan backend production sudah deployed & green
2. Catat Production Backend URL
3. Update frontend config untuk point ke production URL
4. Test lagi flow yang sama (register → login → dashboard)
5. Jangan gunakan email real untuk production testing — gunakan email dummy

---

## 🚀 Langkah 4: Go-Live Checklist

Sebelum production benar-benar live untuk users:

- [ ] Backend Dev deployed & tested ✅
- [ ] Backend Prod deployed & tested ✅
- [ ] Database Dev seeded dengan test data ✅
- [ ] Database Prod empty & ready untuk users ✅
- [ ] Frontend local bisa connect ke Dev backend ✅
- [ ] Frontend local bisa connect ke Prod backend ✅
- [ ] Register flow works end-to-end (Dev) ✅
- [ ] Login flow works end-to-end (Dev) ✅
- [ ] Dashboard loads dengan data (Dev) ✅
- [ ] Responsive mobile testing done (Dev) ✅
- [ ] Production security check (CORS, headers, etc) ✅
- [ ] Database backup strategy documented
- [ ] Monitoring & logging enabled
- [ ] Error handling tested

---

## 🔧 Troubleshooting

### Backend tidak build/deploy

**Error: "Module not found" atau "npm ERR"**
```
Solusi:
1. Pastikan backend/package.json ada & valid
2. Cek di Railway: Variables sudah set?
3. Buka tab "Deployments" → klik yang error → baca full log
4. Common issue: DATABASE_URL typo atau belum di-set
```

### Frontend tidak connect ke backend

**Error: "Failed to fetch" atau CORS error di console**
```
Solusi:
1. Pastikan VITE_API_URL/REACT_APP_API_URL set ke backend URL
2. Cek backend CORS_ORIGIN sudah include frontend URL
3. Backend harus punya CORS middleware (sudah ada di kode)
4. Kalau masih error: refresh browser (Ctrl+Shift+R) untuk clear cache
```

### Database connection error

**Error: "ECONNREFUSED" atau "no such table"**
```
Solusi:
1. Pastikan DATABASE_URL set di Variables
2. Kalau masih error: kemungkinan prisma migration belum jalan
3. Di Railway backend startup log: lihat apakah ada "prisma db push"
4. Jika tidak: database belum init
```

### Deployment stuck atau hanging

**Status: "Pending" atau "In Progress" > 10 menit**
```
Solusi:
1. Klik deployment yang stuck → baca log terakhir
2. Kalau ada error terakhir: itu masalahnya
3. Kalau log berhenti di tengah: mungkin flaky, klik "Redeploy"
4. Kalau masih stuck: hubungi Railway support
```

---

## 📊 Monitoring & Logs

### Melihat Logs di Railway

1. Klik service (backend atau frontend)
2. Tab **"Logs"**
3. Lihat real-time logs dari aplikasi
4. Error akan terlihat di sini

### Common Log Patterns

**Normal (App running):**
```
> rumah-kas-backend@1.0.0 start
> prisma db push && node prisma/seed.js && node src/index.js

Environment: production
Prisma schema loaded from ./prisma/schema.prisma
✔ Database synced, no schema change or destructive change detected

Server running on port 8080
```

**Error (Database not connected):**
```
ERROR: connect ECONNREFUSED 127.0.0.1:5432
DATABASE_URL not set or invalid
```

---

## 🔐 Security Notes

1. **Never commit `.env` files** — hanya `.env.example` di git
2. **JWT_SECRET:** Setiap environment punya secret BERBEDA. Simpan di Railway Variables, bukan di git.
3. **Database access:** Hanya Railway yang bisa akses database — tidak perlu public IP
4. **CORS:** Whitelist hanya domain yang diizinkan
5. **Production checks:**
   - Helmet enabled (untuk security headers)
   - Rate limiting enabled (untuk prevent DDoS)
   - Input validation di backend (sudah ada)

---

## 📝 Environment Variables Summary

### Development Backend
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
NODE_ENV=development
JWT_SECRET=[dev_random_string_32+_chars]
JWT_EXPIRES_IN=12h
CORS_ORIGIN=http://localhost:3000,https://rumah-kas-dev.up.railway.app
```

### Production Backend
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
NODE_ENV=production
JWT_SECRET=[prod_random_string_32+_chars_DIFFERENT]
JWT_EXPIRES_IN=24h
CORS_ORIGIN=https://rumah-kas.up.railway.app,https://rumahkas.id
LOG_LEVEL=info
```

### Frontend (Local .env.local)
```
VITE_API_URL=https://rumah-kas-dev.up.railway.app  # For dev
# atau
VITE_API_URL=https://rumah-kas-prod.up.railway.app  # For prod
```

---

## 🎯 Next Steps (Post-Deployment)

1. **Frontend Deployment** (Netlify/Vercel/Railway)
   - Dokumentasi: FRONTEND-DEPLOYMENT.md (belum ada)

2. **Custom Domain Setup**
   - Setup DNS untuk domain sendiri
   - Dokumentasi: CUSTOM-DOMAIN.md (belum ada)

3. **Performance Optimization**
   - Caching strategy
   - CDN for static assets
   - Database indexing

4. **User Acceptance Testing (UAT)**
   - Real users test aplikasi
   - Bug reporting & fixing
   - Performance monitoring

5. **Payment Gateway Integration** (Phase 2)
   - Stripe atau GCPay
   - Subscription management
   - Invoice generation

---

**Questions?** 📧 Hubungi atau buat issue di GitHub.

🏠 **Pundi — Kelola Keuangan Keluarga dengan Mudah**
