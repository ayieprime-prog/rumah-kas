# Backup Database RumahKas

Railway hanya menyediakan backup otomatis di paket Pro (berbayar). Selama
masih di paket gratis, backup dilakukan manual dengan `pg_dump`, dijalankan
dari komputer Anda sendiri (bukan dari Railway Console, karena container
Railway bersifat sementara dan tidak ada tempat menyimpan file secara
permanen di sana).

## Persiapan (sekali saja)

1. Install PostgreSQL client tools di komputer Anda (untuk dapat perintah
   `pg_dump`):
   - **Windows**: unduh installer dari https://www.postgresql.org/download/windows/
     (pilih "Command Line Tools" saja saat instalasi kalau tidak perlu
     server Postgres penuh)
   - **Mac**: `brew install postgresql`
   - **Linux**: `sudo apt install postgresql-client` (atau setara)

2. Ambil connection string publik dari Railway:
   - Buka project Railway → service **Postgres** → tab **Connect**
   - Salin **Postgres Connection URL** yang berbentuk publik (bukan yang
     `...railway.internal...` — itu hanya bisa diakses dari dalam Railway).
     Biasanya formatnya:
     `postgresql://postgres:PASSWORD@HOST.proxy.rlwy.net:PORT/railway`

## Menjalankan backup

Di terminal komputer Anda:

```bash
pg_dump "POSTGRES_CONNECTION_URL_PUBLIK" > rumahkas_backup_2026-09-21.sql
```

Ganti tanggal di nama file sesuai hari itu. Simpan file `.sql` ini di tempat
aman (Google Drive, external disk, dll) — file ini berisi seluruh data
RumahKas (bisa dipakai untuk restore penuh).

## Kapan harus backup

- Sebelum melakukan perubahan skema database (`npm run migrate`)
- Secara rutin, misalnya sebulan sekali, begitu data keuangan asli mulai
  banyak dipakai sehari-hari
- Sebelum eksperimen besar (migrasi data, fitur baru yang mengubah struktur)

## Cara restore (kalau suatu saat perlu)

```bash
psql "POSTGRES_CONNECTION_URL_PUBLIK" < rumahkas_backup_2026-09-21.sql
```

**Hati-hati**: ini akan menimpa data yang sudah ada di database tujuan.
Pastikan connection string mengarah ke database yang benar sebelum
menjalankan restore.
