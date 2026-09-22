# Production Deployment Guide - Rumah Kas Phase A MVP

## Overview
This guide covers deploying the Rumah Kas application with the Phase A MVP (Wallet Management & Dashboard Redesign) to production.

**Current Version**: Phase A MVP  
**Branch**: `main-yjl8ih`  
**Release Date**: September 22, 2026

## Pre-Deployment Checklist

- [x] All code committed to `main-yjl8ih` branch
- [x] Frontend builds successfully (zero errors)
- [x] Backend syntax validated
- [x] Database schema and migrations prepared
- [x] Seed script for default wallets created
- [x] All tests passed
- [x] Git history clean

## Deployment Methods

### Option 1: Docker (Recommended)

#### Prerequisites
- Docker and Docker Compose installed
- PostgreSQL database running (or Docker image)
- Environment variables configured

#### Steps

1. **Prepare Environment**
```bash
# Clone and checkout the branch
git clone https://github.com/ayieprime-prog/rumah-kas.git
cd rumah-kas
git checkout main-yjl8ih

# Create .env file for production
cat > backend/.env << 'EOF'
DATABASE_URL="postgresql://username:password@db-host:5432/rumah_kas_prod"
JWT_SECRET="your-production-secret-key-at-least-32-chars-long"
JWT_EXPIRES_IN="12h"
NODE_ENV="production"
PORT=5000
CORS_ORIGIN="https://yourdomain.com"
EOF
```

2. **Build Docker Image**
```bash
docker build -t rumah-kas:phase-a-mvp .
```

3. **Run Container**
```bash
docker run -d \
  --name rumah-kas \
  -p 5000:5000 \
  --env-file backend/.env \
  -e DATABASE_URL="postgresql://user:pass@db:5432/rumah_kas_prod" \
  rumah-kas:phase-a-mvp
```

4. **Database Setup**
```bash
# Run migrations inside container
docker exec rumah-kas npm run migrate

# Seed default wallets
docker exec rumah-kas node backend/seed-wallets.js
```

### Option 2: Traditional Server Deployment

#### Prerequisites
- Node.js 22+ installed
- PostgreSQL database running
- npm/yarn installed

#### Steps

1. **Clone Repository**
```bash
git clone https://github.com/ayieprime-prog/rumah-kas.git
cd rumah-kas
git checkout main-yjl8ih
```

2. **Install Dependencies**
```bash
# Frontend
cd frontend
npm install
npm run build

# Backend
cd ../backend
npm install
```

3. **Configure Environment**
```bash
# Create .env in backend directory
cp .env.example .env

# Edit .env with production values:
# - DATABASE_URL: Your production PostgreSQL URL
# - JWT_SECRET: Generate a secure 32+ character string
# - NODE_ENV: Set to "production"
# - CORS_ORIGIN: Your production domain
# - PORT: 5000 or your preferred port
```

4. **Database Setup**
```bash
cd backend

# Run migrations
npx prisma migrate deploy

# Seed default wallets for existing households
node seed-wallets.js
```

5. **Start Application**
```bash
# Option A: Direct (development server)
npm start

# Option B: Production with PM2
npm install -g pm2
pm2 start src/index.js --name "rumah-kas" --env production
pm2 startup
pm2 save
```

### Option 3: Cloud Platform (Heroku, Railway, Render)

#### Heroku Example
```bash
# Create Heroku app
heroku create rumah-kas-app

# Add PostgreSQL add-on
heroku addons:create heroku-postgresql:standard-0

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET="your-production-secret"

# Deploy
git push heroku main-yjl8ih:main

# Run migrations
heroku run npm run migrate --prefix backend
heroku run node backend/seed-wallets.js
```

## Post-Deployment Steps

### 1. Verify Health Check
```bash
curl http://localhost:5000/health
# Expected: {"status":"OK","mode":"full","routesLoaded":true,"db":"configured"}
```

### 2. Test API Endpoints
```bash
# Test wallet endpoint (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/wallets

# Expected: [] or array of wallets
```

### 3. Verify Database Connection
```bash
# Check if migrations applied
psql $DATABASE_URL -c "\dt"

# Should show: Wallet, Expense, Income, etc. tables
```

### 4. Monitor Logs
```bash
# For Docker
docker logs -f rumah-kas

# For PM2
pm2 logs rumah-kas

# Expected: No error messages, only startup logs
```

## Database Schema Changes (Phase A MVP)

### New Table: Wallet
```sql
CREATE TABLE "Wallet" (
  "id" TEXT PRIMARY KEY,
  "householdId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'CASH',
  "balance" DOUBLE PRECISION DEFAULT 0,
  "icon" TEXT DEFAULT 'wallet',
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP,
  FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE
);
```

### Updated Tables
- **Expense**: Added optional `walletId` (foreign key, SET NULL on delete)
- **Income**: Added optional `walletId` (foreign key, SET NULL on delete)

### Indexes Created
- Wallet_householdId_idx
- Expense_walletId_idx
- Income_walletId_idx

## API Changes

### New Endpoints
- `GET /api/wallets` - List all wallets
- `GET /api/wallets/summary` - Total balance and count
- `POST /api/wallets` - Create wallet
- `PUT /api/wallets/:id` - Update wallet
- `DELETE /api/wallets/:id` - Delete wallet

### Updated Endpoints
- `POST /api/expenses` - Now accepts optional `walletId`
- `PUT /api/expenses/:id` - Now accepts optional `walletId`
- `POST /api/income` - Now accepts optional `walletId`
- `PUT /api/income/:id` - Now accepts optional `walletId`
- `GET /api/dashboard` - Now includes `wallets` and `walletSummary`

## Frontend Changes

### New Pages
- `/wallets` - Wallet management page

### Updated Pages
- `/` - Dashboard redesigned with Seruma layout
- `/expenses` - Wallet selection added to form
- `/income` - Wallet selection added to form

### New Components
- WalletPage.jsx
- Updated DashboardPage.jsx (with wallet tabs, Saldo Aktif, Uang Bebas)

## Backward Compatibility

✅ **Fully backward compatible**
- Existing expenses/incomes unaffected
- Wallet fields are optional
- No breaking changes to existing API
- All existing data preserved

## Production Monitoring

### Key Metrics to Monitor
1. **Response Times**: Dashboard should load in < 2s
2. **Error Rates**: Check `/health` endpoint regularly
3. **Database Performance**: Monitor wallet queries (indexed)
4. **User Activity**: Track wallet creation/deletion

### Recommended Alerts
```
- Health check fails
- Error rate > 1%
- Response time > 5s
- Database connection lost
```

## Rollback Plan

If issues occur in production:

```bash
# Revert to previous version
git checkout HEAD~1  # Goes to Phase 1 (without dashboard redesign)

# Or specific commit
git checkout 518339e  # Phase 1 base commit

# Rebuild and restart
docker build -t rumah-kas:rollback .
docker stop rumah-kas
docker run -d ... rumah-kas:rollback
```

Note: Database migrations are backward compatible. Wallet table remains but won't be used.

## Troubleshooting

### Issue: "Database not configured"
**Solution**: Verify `DATABASE_URL` environment variable is set correctly

### Issue: "Wallets endpoint returns 401"
**Solution**: Ensure user is authenticated (valid JWT token)

### Issue: "Migration fails"
**Solution**: Check database permissions and connection string

### Issue: "Seed script fails"
**Solution**: Verify database is running and migrations completed first

## Performance Optimizations

Implemented in Phase A MVP:
- ✅ Database indexes on walletId, householdId
- ✅ Optimized dashboard queries (single batch fetch)
- ✅ Frontend code splitting and minification
- ✅ CSS optimization (20.35 KB → 4.53 KB gzipped)

## Security Checklist

- [x] JWT authentication required for all API endpoints
- [x] Household-scoped queries (users can't access other households' data)
- [x] Wallet ownership validation
- [x] No sensitive data in logs
- [x] CORS configured for production domain
- [x] Environment variables not committed to repo

## Support & Documentation

For issues or questions:
1. Check application logs
2. Verify database connectivity
3. Review DEPLOYMENT.md (this file)
4. Check GitHub issues: https://github.com/ayieprime-prog/rumah-kas/issues

## Version History

| Version | Date | Changes |
|---------|------|---------|
| Phase A MVP | Sept 22, 2026 | Wallet support, dashboard redesign, form integration |
| (Previous) | Earlier | Initial app setup |

## Next Steps (Phase B - Future)

- Asset tracking
- Transfer feature between wallets
- Alokasi Pendapatan chart
- Advanced budget analytics

---

**Deployment Checklist Complete ✅**

Last Updated: September 22, 2026
Status: Ready for Production
