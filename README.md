# 🏠 Pundi — Manajemen Keuangan Keluarga

Pundi adalah platform SaaS untuk manajemen keuangan keluarga yang memungkinkan pasangan suami-istri mengelola keuangan bersama dengan mudah dan aman.

## ✨ Fitur Utama

- **Dashboard Overview** — Ringkasan keuangan keluarga real-time
- **Expense Tracking** — Pencatatan pengeluaran dengan kategori
- **Income Management** — Tracking pemasukan dari berbagai sumber
- **Budget Planning** — Penentuan dan monitoring anggaran per kategori
- **Financial Goals** — Target tabungan dengan progress tracking
- **Debt Management** — Manajemen hutang dan cicilan
- **Reports & Analytics** — Laporan keuangan bulanan & tahunan
- **Multi-User Collaboration** — Akses suami/istri dengan permission control
- **Notifications & Alerts** — Notifikasi budget exceeded dan milestone

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express.js
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Helmet, CORS, Rate Limiting

**Frontend:**
- React 18
- Vite
- React Router v6
- Axios
- Recharts (data visualization)
- Lucide Icons

**Infrastructure:**
- Railway (hosting + database)
- GitHub (source control)

## 📦 Project Structure

```
rumah-kas/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   └── seed.js                # Initial data
│   ├── src/
│   │   ├── index.js               # Main server
│   │   ├── middleware/            # Auth, error handling
│   │   └── routes/                # API endpoints
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/                 # Page components
│   │   ├── components/            # Reusable components
│   │   ├── App.jsx                # Root component
│   │   └── main.jsx               # Entry point
│   ├── package.json
│   └── vite.config.js
├── package.json                    # Root workspace
└── README.md
```

## 🚀 Quick Start

### Instalasi Lokal

1. **Clone repository**
   ```bash
   git clone https://github.com/ayieprime-prog/rumah-kas.git
   cd rumah-kas
   ```

2. **Setup environment**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env dengan DATABASE_URL lokal
   
   # Frontend (opsional)
   cp frontend/.env.example frontend/.env
   ```

3. **Install dependencies**
   ```bash
   npm run install:all
   ```

4. **Setup database**
   ```bash
   cd backend
   npm run seed
   ```

5. **Run development**
   ```bash
   npm run dev
   ```

   Backend akan jalan di `http://localhost:5000`
   Frontend akan jalan di `http://localhost:3000`

## 🚀 Deploy ke Railway

### Langkah 1: Setup Railway Project

1. Buka https://railway.app
2. Login dengan GitHub
3. Buat project baru → "Deploy from GitHub repo"
4. Pilih `ayieprime-prog/rumah-kas`

### Langkah 2: Tambah PostgreSQL Database

1. Di dalam project, klik "+ New" → "Database" → "Add PostgreSQL"
2. Railway akan create database + `DATABASE_URL`

### Langkah 3: Set Environment Variables

Di service aplikasi, buka tab "Variables" dan tambahkan:

| Nama | Nilai |
|------|-------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `JWT_SECRET` | Generate random string 32+ chars (gunakan https://1password.com/password-generator/) |
| `JWT_EXPIRES_IN` | `12h` |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | (akan di-generate Railway) |

### Langkah 4: Deploy

1. Klik "Deploy" → tunggu build selesai
2. Setelah sukses, buka tab "Settings" → "Networking" → "Generate Domain"
3. Akses aplikasi di domain yang di-generate

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` — Daftar akun & household baru
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get current user

### Household
- `GET /api/household` — Get household details
- `POST /api/household/invite-member` — Invite spouse
- `GET /api/household/members` — Get members
- `PUT /api/household/settings` — Update settings

### Expenses
- `POST /api/expenses` — Create expense
- `GET /api/expenses` — Get expenses (with filters)
- `PUT /api/expenses/:id` — Update expense
- `DELETE /api/expenses/:id` — Delete expense

### Income
- `POST /api/income` — Create income
- `GET /api/income` — Get incomes
- `PUT /api/income/:id` — Update income
- `DELETE /api/income/:id` — Delete income

### Budget
- `POST /api/budget` — Create budget
- `GET /api/budget` — Get budgets
- `PUT /api/budget/:id` — Update budget
- `DELETE /api/budget/:id` — Delete budget

### Goals
- `POST /api/goals` — Create goal
- `GET /api/goals` — Get goals
- `PUT /api/goals/:id` — Update goal
- `DELETE /api/goals/:id` — Delete goal

### Debt
- `POST /api/debt` — Create debt
- `GET /api/debt` — Get debts
- `PUT /api/debt/:id` — Update debt
- `DELETE /api/debt/:id` — Delete debt

### Dashboard & Reports
- `GET /api/dashboard` — Get dashboard overview
- `GET /api/reports/monthly/:month` — Get monthly report
- `GET /api/reports/yearly/:year` — Get yearly report

### Notifications
- `GET /api/notifications` — Get notifications
- `PUT /api/notifications/:id/read` — Mark as read
- `PUT /api/notifications/mark-all-read` — Mark all as read
- `DELETE /api/notifications/:id` — Delete notification

## 🔐 Security

- JWT-based authentication
- Bcrypt password hashing
- Helmet for HTTP headers
- CORS protection
- Rate limiting
- Input validation
- SQL injection prevention (via Prisma)

## 📚 Documentation

- [Backend Documentation](./backend/README.md) — API details
- [Frontend Documentation](./frontend/README.md) — Component guide
- [Deployment Guide](./DEPLOYMENT.md) — Railway setup steps

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

Proprietary — Pundi SaaS Platform

## 👥 Team

- **Developer:** [Your Name]
- **Supported by:** Claude AI

---

**Questions?** Buka issue di GitHub atau hubungi support.

🏠 **Pundi — Kelola Keuangan Keluarga dengan Mudah**
