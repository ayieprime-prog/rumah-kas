# Pundi — Deploy ke Cloud (Railway)

Panduan ini menggantikan pengembangan lokal sebagai cara utama menjalankan aplikasi. Setelah mengikuti langkah-langkah ini, aplikasi Pundi bisa diakses dari HP/tablet/laptop mana pun dengan internet — tidak perlu komputer menyala, tidak perlu tethered WiFi.

Kode sudah disiapkan sepenuhnya. Bagian di bawah ini murni klik-klik di website Railway, tidak ada yang perlu diketik lewat command line.

## Langkah 1 — Buat Akun Railway

1. Buka https://railway.app
2. Klik **"Login"**, pilih **"Login with GitHub"**
3. Masuk dengan akun GitHub `ayieprime-prog` (yang sudah kita pakai), lalu izinkan aksesnya.

## Langkah 2 — Buat Project Baru dari Repo GitHub

1. Di dashboard Railway, klik **"New Project"** atau **"Create Project"**
2. Pilih **"Deploy from GitHub repo"**
3. Pilih repo **`ayieprime-prog/rumah-kas`**
   (Kalau tidak muncul di daftar, klik "Configure GitHub App" dan beri izin akses ke repo tersebut)
4. Railway akan otomatis mulai build — biarkan dulu, kita perlu menambah beberapa hal dulu di langkah berikutnya sebelum ini berhasil jalan.

## Langkah 3 — Tambah Database PostgreSQL

1. Di dalam project yang baru dibuat, klik **"+ New"** (atau tombol "Create")
2. Pilih **"Database"** → **"Add PostgreSQL"**
3. Railway otomatis membuat database dan membuat variabel `DATABASE_URL` untuknya.

## Langkah 4 — Isi Variabel Lingkungan (Environment Variables)

1. Klik service aplikasi (bukan yang PostgreSQL), buka tab **"Variables"**
2. Tambahkan variabel-variabel berikut satu per satu (klik "New Variable"):

| Nama | Nilai | Keterangan |
|------|-------|-----------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Mengacu ke database yang baru dibuat — ketik persis begitu, Railway menghubungkannya otomatis |
| `NODE_ENV` | `production` | Environment production |
| `JWT_SECRET` | Buat nilai acak & panjang sendiri | Gunakan https://1password.com/password-generator/ (pilih "random string", minimal 32 karakter) |
| `JWT_EXPIRES_IN` | `12h` | Token expiry duration |

**Catatan Keamanan Penting**: JANGAN PERNAH menuliskan nilai asli `JWT_SECRET` di file mana pun yang ikut disimpan ke git. Commit tersimpan permanen di riwayat repo dan bisa dibaca siapa pun yang punya akses ke repo. Simpan nilai aslinya hanya di Railway (tab Variables) dan/atau password manager pribadi Anda.

**Jangan** menambahkan variabel `PORT` di sini — biarkan kosong, Railway yang mengatur itu otomatis.

## Langkah 5 — Deploy & Buka Aplikasinya

1. Setelah semua variabel diisi, Railway akan otomatis build ulang karena variabel berubah
2. Tunggu build selesai (lihat tab "Deployments" → klik yang sedang berjalan → lihat log). Proses pertama biasanya beberapa menit.
3. Setelah sukses, buka tab **"Settings"** service ini → bagian **"Networking"** → klik **"Generate Domain"**. Railway akan memberi alamat publik seperti `https://rumah-kas-production.up.railway.app`
4. Buka alamat itu di browser (atau HP) — halaman login Pundi akan muncul, dengan sertifikat HTTPS resmi.
5. **Daftar akun baru:**
   - Nama Keluarga: Isikan nama keluarga Anda (misal: "Keluarga Budi")
   - Nama Lengkap: Isikan nama Anda
   - Email: Isikan email Anda
   - Password: Buat password kuat

## Langkah 6 — Invite Spouse (Opsional — Fase 2)

Setelah aplikasi berjalan, Anda bisa mengundang suami/istri untuk bergabung:
1. Di aplikasi, buka **Pengaturan** → **Invite Member**
2. Masukkan email suami/istri
3. Suami/istri akan menerima email dengan akses link

(Fitur ini akan di-implementasikan di fase berikutnya)

## Kalau Build Gagal

Buka tab "Deployments" → klik deployment yang gagal → baca log error, lalu kirim potongan pesan errornya (screenshot atau salin-tempel teks) untuk dibantu.

**Error umum:**
- `DATABASE_URL not set` — Pastikan `DATABASE_URL` sudah di-set di Variables, jangan typo
- `Module not found` — Pastikan sudah `npm install` di local sebelum push
- `Port already in use` — Tidak perlu set PORT, Railway mengaturnya otomatis

## Database Migrations

Aplikasi menggunakan Prisma untuk database. Saat deployment pertama:
1. Railway otomatis run `prisma db push` (lihat di startup logs)
2. Schema akan di-create otomatis di PostgreSQL Railway

Kalau ada error di migration, hubungi untuk dibantu debug.

## Next Steps

1. ✅ Aplikasi sudah live di cloud
2. ⏳ Ekspansi fitur (Expense tracking, Budget, Goals, dll)
3. ⏳ Setup custom domain (misal: rumahkas.id)
4. ⏳ Setup payment gateway untuk subscription model

---

**Butuh bantuan?** Buka issue di GitHub atau hubungi support@rumahkas.id

🏠 **Pundi — Kelola Keuangan Keluarga dengan Mudah**
