# RumahKas — User Testing Guide

Panduan lengkap untuk User Acceptance Testing (UAT) sebelum go-live ke production.

---

## 📋 Testing Phases

### Phase 1: Developer Testing (Anda sendiri) — 1 jam
### Phase 2: Spouse Testing (Pasangan) — 1-2 jam
### Phase 3: Bug Fix & Iteration — As Needed

---

## 🧪 Phase 1: Developer Testing (Setup)

Tujuan: Pastikan semua fitur core berjalan tanpa error.

### Test Environment Setup

1. **Backend Development**
   - URL: Dari Railway (`https://rumah-kas-dev.up.railway.app`)
   - Status: Lihat tab "Deployments" → harus green
   - Database: Sudah auto-migrated & seeded

2. **Frontend Local**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   - Akses: `http://localhost:3000`
   - API URL: Harus point ke dev backend URL

---

## ✅ Test Case 1: Registration Flow

### Steps:
1. Buka `http://localhost:3000`
2. Halaman **Login** muncul (tidak error)
3. Klik **"Register"** (atau link "Sign Up")
4. Form **Register** muncul dengan fields:
   - [ ] Nama Keluarga (Household Name) — text input
   - [ ] Nama Lengkap (Full Name) — text input
   - [ ] Email — email input
   - [ ] Password — password input
   - [ ] Confirm Password — password input (jika ada)
   - [ ] "Register" button

### Test Data (Developer):
```
Nama Keluarga: Keluarga Budi (Dev)
Nama Lengkap: Budi Santoso
Email: budi-dev@example.com
Password: DevTest123!@#
```

### Expected Results:
- [ ] Form validation works (misal: email format, password strength)
- [ ] No console errors (F12 → Console tab harus bersih)
- [ ] Klik Register → API call ke backend (cek Network tab)
- [ ] Success: Redirect ke halaman Login
- [ ] Email di database tercatat (backend logs atau database check)

### Acceptance Criteria:
- ✅ Register berhasil tanpa error
- ✅ Data tersimpan di database
- ✅ Redirect ke login flow

---

## ✅ Test Case 2: Login Flow

### Steps:
1. Di halaman Login (setelah register berhasil)
2. Input email & password yang baru dibuat di Test Case 1
3. Klik **"Login"**

### Expected Results:
- [ ] Email & password diterima (validasi)
- [ ] Backend return JWT token (cek Network tab)
- [ ] Token disimpan di localStorage (F12 → Application → localStorage → cari `token`)
- [ ] Redirect ke **Dashboard**
- [ ] Dashboard muncul dengan data (stats, charts, dll)
- [ ] Tidak ada 401/403 error

### Acceptance Criteria:
- ✅ Login berhasil
- ✅ Token tersimpan di browser
- ✅ Dashboard accessible

---

## ✅ Test Case 3: Dashboard Layout & Display

### Steps:
1. Sudah login & di Dashboard
2. Lihat semua komponen

### Expected Visuals:
- [ ] **Header:** Logo, user name, logout button — visible & responsive
- [ ] **Sidebar:** Navigation menu dengan items:
  - [ ] Dashboard (current page, active)
  - [ ] Expenses
  - [ ] Income
  - [ ] Budget
  - [ ] Goals
  - [ ] Debt
  - [ ] Reports
  - [ ] Settings
- [ ] **Main Content:** Dashboard stats
  - [ ] Total Balance card
  - [ ] Total Income card
  - [ ] Total Expenses card
  - [ ] Savings Goal Progress (progress bar)
  - [ ] Expense Category Pie Chart (recharts)
  - [ ] Recent Transactions (table or list)
  - [ ] Quick Actions (buttons)

### Responsive Test:
```
Browser Window Sizes:
- [ ] Desktop: 1920x1080 (normal)
- [ ] Laptop: 1366x768 (typical laptop)
- [ ] Tablet: 768x1024 (iPad)
- [ ] Mobile: 375x667 (iPhone SE)
```

Test cara:
1. F12 → Device Emulation (Ctrl+Shift+M)
2. Coba ukuran berbeda
3. Lihat apakah layout tetap readable (no overflow, text readable, buttons clickable)

### Acceptance Criteria:
- ✅ Semua sections visible
- ✅ Layout responsive di semua ukuran
- ✅ No layout breaks (horizontal scroll, overlapping)
- ✅ Charts render correctly

---

## ✅ Test Case 4: Navigation Flow

### Steps:
1. Di Dashboard
2. Klik **"Expenses"** di sidebar
3. Halaman Expenses muncul (stub page OK untuk dev testing)

### Repeat untuk:
- [ ] Expenses page
- [ ] Income page
- [ ] Budget page
- [ ] Goals page
- [ ] Debt page
- [ ] Reports page
- [ ] Settings page

### Expected Results:
- [ ] Setiap halaman muncul tanpa error
- [ ] Sidebar item active sesuai page yang dibuka
- [ ] Bisa navigate kembali ke Dashboard
- [ ] Browser back button bekerja (browser history OK)

### Acceptance Criteria:
- ✅ Navigation smooth & responsive
- ✅ Tidak ada routing errors
- ✅ Active state indikator works

---

## ✅ Test Case 5: User Profile & Settings (Bonus)

### Steps:
1. Klik **Settings** di sidebar
2. Lihat user profile / settings page
3. Klik user icon/menu di header (jika ada)
4. Coba logout

### Expected Results:
- [ ] Settings page load
- [ ] User info ditampilkan (nama, email)
- [ ] Logout button tersedia
- [ ] Klik Logout → redirect ke Login page
- [ ] Token dihapus dari localStorage
- [ ] Coba akses Dashboard → di-redirect ke Login (auth check works)

### Acceptance Criteria:
- ✅ User profile accessible
- ✅ Logout works correctly
- ✅ Auth protection active

---

## ✅ Test Case 6: Error Handling

### Scenario 1: Invalid Login Credentials
- [ ] Login dengan email: `wrong@example.com` password: `wrong`
- [ ] Expected: Error message (user-friendly)
- [ ] Not expected: Application crash atau blank screen

### Scenario 2: Weak Password Registration
- [ ] Register dengan password: `123` (terlalu pendek)
- [ ] Expected: Validation error (password minimal X karakter)
- [ ] Not expected: Server error atau weird response

### Scenario 3: Duplicate Email
- [ ] Register dengan email yang sudah terdaftar sebelumnya
- [ ] Expected: Error message "Email sudah terdaftar"
- [ ] Not expected: Success atau duplicate akun

### Scenario 4: Network Error Simulation
- [ ] Buka DevTools → Network tab
- [ ] Set throttling: "Offline"
- [ ] Coba login
- [ ] Expected: Timeout error atau clear message
- [ ] Set back to "Online"

### Acceptance Criteria:
- ✅ Error messages user-friendly
- ✅ No crashes atau white screen
- ✅ Clear guidance on what went wrong

---

## 📋 Phase 2: Spouse Testing (UAT)

Setelah dev testing selesai, libatkan pasangan.

### Pre-Test Brief:
```
Salam! 👋

Kami ingin Anda membantu test aplikasi RumahKas yang sedang development.
Aplikasi ini untuk kelola keuangan keluarga bersama-sama.

Tolong:
1. Jalankan tahapan test yang ada di form berikut
2. Catat setiap masalah (error, UI weird, sulit dipahami)
3. Berikan feedback jujur
4. Berapa lama waktu yang dibutuhkan

Terima kasih! 🙏
```

### Test Checklist untuk Spouse:

#### 1. Registrasi Akun Pribadi
- [ ] Buka aplikasi → Halaman login muncul
- [ ] Klik Register → Bisa input form?
- [ ] Isi data pribadi & daftar
- [ ] Berhasil atau error?
- **Time taken:** ___ menit
- **Issues:** ________________

#### 2. Login
- [ ] Login dengan akun yang baru dibuat
- [ ] Berhasil masuk?
- [ ] Dashboard muncul?
- **Time taken:** ___ menit
- **Issues:** ________________

#### 3. Dashboard Comprehension
- [ ] Apakah dashboard mudah dipahami?
- [ ] Informasi mana yang paling penting?
- [ ] Ada yang membingungkan?
- **Feedback:** ________________

#### 4. Navigation
- [ ] Coba klik berbagai menu (Expenses, Budget, Goals, dll)
- [ ] Mudah navigasi?
- [ ] Ada button/link yang tidak jelas fungsinya?
- **Feedback:** ________________

#### 5. Mobile Experience (Jika testing di mobile)
- [ ] Aplikasi responsive?
- [ ] Tombol-tombol mudah diklik?
- [ ] Ada text yang terpotong?
- [ ] Overall feel: Comfortable atau uncomfortable?
- **Feedback:** ________________

#### 6. General Impressions
- [ ] Overall first impression: Good / Neutral / Bad
- [ ] Would you use this app? Yes / Maybe / No
- [ ] Suggestions untuk improvement:
  - _________________
  - _________________
  - _________________

---

## 📝 Bug Report Template

Kalau ditemukan bug, gunakan template ini:

```markdown
## Bug Report

**Title:** [Singkat deskripsi bug]

**Severity:** 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low

**Environment:**
- Browser: Chrome / Firefox / Safari / Edge
- Device: Desktop / Tablet / Mobile
- URL: https://rumah-kas-dev.up.railway.app

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior:**
[Apa yang seharusnya terjadi]

**Actual Behavior:**
[Apa yang terjadi sebenarnya]

**Screenshots/Video:**
[Attach screenshot atau screen recording]

**Console Errors:**
[Jika ada error di DevTools Console, copy-paste di sini]

**Additional Info:**
[Info tambahan yang relevan]
```

---

## 🔄 Phase 3: Bug Fix & Iteration

1. Kumpulkan semua bug reports dari Phase 1 & 2
2. Kategorisasi by severity:
   - 🔴 **Critical:** Block access ke fitur, crash aplikasi
   - 🟠 **High:** Feature tidak works properly
   - 🟡 **Medium:** UI/UX issues, minor features
   - 🟢 **Low:** Typo, color, spacing

3. Fix by priority
4. Re-deploy ke Railway (dev environment)
5. Re-test di buggy areas
6. Repeat sampai green

---

## 📊 Testing Metrics

### Setelah semua testing selesai, record:

```
Total Testing Time: ___ hours
Total Bugs Found: ___
  - Critical: ___
  - High: ___
  - Medium: ___
  - Low: ___

Go-Live Ready: Yes / No / Conditional

If Conditional:
- Must fix before go-live: [list critical/high bugs]
- Can fix after go-live: [list medium/low bugs]
```

---

## ✅ Go-Live Checklist

Sebelum launch ke production:

- [ ] Semua critical bugs fixed & tested
- [ ] Semua high bugs fixed & tested
- [ ] UAT passed oleh spouse & developer
- [ ] Performance acceptable (page loads < 3 sec)
- [ ] Mobile responsive tested & OK
- [ ] Database seeded dengan reasonable data
- [ ] Error handling implemented
- [ ] Logging & monitoring setup
- [ ] Backup strategy documented

---

## 🚀 Launch Sequence

1. **Day Before:**
   - [ ] Final testing pass (dev & prod)
   - [ ] Database backup prod (jika ada data)
   - [ ] Notify spouse: "Launching tomorrow"

2. **Launch Day:**
   - [ ] Deploy final code to production
   - [ ] Verify prod URL accessible
   - [ ] Test prod registration & login
   - [ ] Send invite link untuk spouse ke production
   - [ ] Both login to prod & verify works

3. **Post-Launch (First 24 hours):**
   - [ ] Monitor logs untuk errors
   - [ ] Spouse report any issues
   - [ ] Be ready untuk quick fixes
   - [ ] Document any unexpected issues

---

## 📞 Support & Questions

Jika ada issue saat testing:
1. Check error logs (DevTools Console atau Railway Logs)
2. Try refresh page (Ctrl+Shift+R untuk hard refresh)
3. Check internet connection
4. Try different browser/device
5. Report bug dengan template di atas

---

**Happy Testing! 🎉**

🏠 **RumahKas — Kelola Keuangan Keluarga dengan Mudah**
