# Backup Database RumahKas

Railway hanya menyediakan backup otomatis di paket Pro (berbayar). Selama
masih di paket gratis, backup dilakukan manual dengan `pg_dump`, dijalankan
dari komputer Anda sendiri.

Catatan: sempat dicoba pakai Railway CLI (`railway connect` / `railway run`)
supaya tidak perlu membuka database ke publik, tapi `railway connect` cuma
membuka sesi `psql` interaktif (tidak bisa dipakai `pg_dump`), dan
`railway run` tidak menyediakan akses jaringan ke database privat dari
komputer lokal. Jadi metode yang benar-benar terbukti berhasil adalah
mengaktifkan **Public Access** sementara di Postgres.

## Persiapan (sekali saja)

Install PostgreSQL client tools di komputer Anda (untuk dapat perintah
`pg_dump`):
- **Windows**: unduh installer dari https://www.postgresql.org/download/windows/
  (boleh centang semua komponen, atau cukup "Command Line Tools" saja
  kalau tidak butuh server Postgres lokal)
- **Mac**: `brew install postgresql`
- **Linux**: `sudo apt install postgresql-client` (atau setara)

## Menjalankan backup

1. Buka Railway → service **Postgres** → tab **Settings** → **Networking**,
   klik **Add Public Access** kalau belum aktif (atau tab **Connect** →
   **Public Network**)
2. Buka tab **Variables**, salin nilai `DATABASE_PUBLIC_URL`
3. Di terminal komputer Anda (PowerShell/cmd/terminal), jalankan — **paste**
   connection string-nya, jangan diketik manual (rawan salah baca
   karakter password):
   ```
   pg_dump "DATABASE_PUBLIC_URL_DISINI" > rumahkas_backup_2026-09-22.sql
   ```
   Kalau `pg_dump` tidak dikenali, tutup dan buka ulang terminal supaya
   PATH ter-update, atau tambahkan manual untuk sesi itu:
   - PowerShell: `$env:Path += ";C:\Program Files\PostgreSQL\<versi>\bin"`
   - cmd: `set PATH=%PATH%;C:\Program Files\PostgreSQL\<versi>\bin`
4. Ganti tanggal di nama file sesuai hari itu. Simpan file `.sql` ini di
   tempat aman (Google Drive, external disk, dll)
5. **Setelah selesai**, matikan lagi Public Access di Railway (tab
   Networking, hapus endpoint publiknya) supaya database tidak terus
   terbuka ke internet

## Kapan harus backup

- Sebelum melakukan perubahan skema database (`npm run migrate`)
- Secara rutin, misalnya sebulan sekali, begitu data keuangan asli mulai
  banyak dipakai sehari-hari
- Sebelum eksperimen besar (migrasi data, fitur baru yang mengubah struktur)

## Cara restore (kalau suatu saat perlu)

```bash
psql "DATABASE_PUBLIC_URL_DISINI" < rumahkas_backup_2026-09-22.sql
```

**Hati-hati**: ini akan menimpa data yang sudah ada di database tujuan.
Pastikan connection string mengarah ke database yang benar sebelum
menjalankan restore.
