# Phase B Development Roadmap - Rumah Kas

## ✅ Completed

### Phase A MVP (Production Ready)
- **PR #1**: Wallet Management & Dashboard Redesign
  - 5 wallet CRUD endpoints
  - Seruma-style dashboard with wallet tabs
  - Wallet integration in expense/income forms
  - Database schema with Wallet model
  - 100% backward compatible
  - Status: ✅ Ready for deployment

### Phase B.1 - Asset Tracking & Portfolio Management (Backend 90% done)
**Branch**: `phase-b-features`

#### ✅ Database Schema
- Asset model with fields: name, type, description, currentValue, purchasePrice, purchaseDate, currency, location, notes
- AssetValuation model for historical tracking
- AssetType enum: REAL_ESTATE, VEHICLE, JEWELRY, ART, CRYPTOCURRENCY, CASH_ALTERNATIVE, OTHER
- Proper foreign keys and indexes

#### ✅ Backend API (7 endpoints at `/api/assets`)
1. `GET /api/assets` - List all assets with portfolio summary
   - Returns: { assets[], summary: { totalValue, byType[] } }
2. `GET /api/assets/:id` - Get single asset with valuation history
3. `POST /api/assets` - Create new asset with initial valuation
4. `PUT /api/assets/:id` - Update asset (auto-creates valuation if value changed)
5. `DELETE /api/assets/:id` - Delete asset
6. `GET /api/assets/:id/valuations` - Get valuation history for charting
7. Portfolio summary endpoint with total value breakdown

#### 🔄 In Progress
- Frontend AssetPage component (basic CRUD UI)
- Dashboard integration (show total portfolio value)
- Asset valuation trending chart
- Asset type filtering/sorting

---

## 📋 TODO - Phase B Features

### Phase B.1 (Continued) - Frontend
**Estimated**: 4-6 hours
- [ ] AssetPage.jsx - Main asset management page
  - Asset list with type icons
  - Create/Edit/Delete modals
  - Summary cards (total value, by type)
  - Asset search & filter
- [ ] AssetChart.jsx - Valuation trend chart
  - Line chart showing value over time
  - Support for multiple assets comparison
- [ ] Dashboard integration
  - Add "Portfolio Value" card to dashboard
  - Show top 3 assets by value
  - Link to full Assets page
- [ ] Frontend styling (Seruma design)
- [ ] Build & test frontend

### Phase B.2 - Transfer Feature
**Estimated**: 3-4 hours
- **What**: Transfer money between own wallets or to other household members
- **Backend**:
  - Transfer model & schema
  - Transfer endpoints (initiate, approve, reject)
  - Support for peer-to-peer transfers with approval workflow
- **Frontend**:
  - Transfer page with wallet selector
  - Pending transfers inbox/list
  - Approval UI for recipients

### Phase B.3 - Alokasi Pendapatan Chart
**Estimated**: 2-3 hours
- **What**: Visualize how income is allocated across savings goals, expenses, wallets
- **Backend**:
  - Calculate income allocation breakdown
  - Historical allocation tracking
- **Frontend**:
  - Pie/donut chart showing allocation
  - Breakdown table
  - Period selector (month/year)

### Phase B.4 - Advanced Budget Analytics
**Estimated**: 4-5 hours
- **What**: Deep insights into spending patterns
- **Features**:
  - Budget vs Actual comparison (bar chart)
  - Spending trends over time (line chart)
  - Category analysis (what's trending up/down)
  - Forecasting (predicted spending next month)
  - Budget efficiency score

---

## 🔧 Phase A Refinements & Fixes

### Critical (Must Fix Before Production)
- [ ] Verify wallet balance updates when expenses/incomes added
- [ ] Test wallet deletion with existing transactions
- [ ] Verify seed-wallets.js runs correctly on first deploy
- [ ] Test form wallet selection on slow networks
- [ ] Verify JWT auth works with wallet endpoints

### Nice-to-Have
- [ ] Add wallet edit page (currently create-only)
- [ ] Wallet balance history chart
- [ ] Wallet transfer feature (between own wallets)
- [ ] Wallet sharing rules (which household member can see which wallet)
- [ ] Wallet notifications (low balance alerts)

---

## 📊 Implementation Order Recommendation

### Priority 1: Ship Phase B.1 (This Week)
1. Create AssetPage frontend component
2. Add asset valuation chart
3. Dashboard portfolio card integration
4. Full end-to-end test
5. Create PR, merge to main
6. **Benefit**: Core asset tracking working for users

### Priority 2: Phase B.2 - Transfers (Next Week)
- Enables inter-wallet & peer transfers
- Essential for shared household management

### Priority 3: Analytics (Week 3)
- Phase B.3 (Alokasi Pendapatan) + Phase B.4 (Budget Analytics)
- Provides deep insights for users

---

## 🚀 Deployment Checklist

### Before Each Phase Release
- [ ] Run full test suite (`npm test`)
- [ ] Build frontend (`npm run build`)
- [ ] Create migration file (`npx prisma migrate dev`)
- [ ] Test on staging environment
- [ ] Create PR with detailed test plan
- [ ] Get code review approval
- [ ] Merge to main
- [ ] Create GitHub release
- [ ] Deploy to production (Railway/Docker)

---

## 📁 Active Branches

- `main-yjl8ih` - Phase A MVP (ready to merge)
- `phase-b-features` - Phase B development (active)
- `master` - Production branch

---

## 🔗 Related PRs & Issues

- **PR #1**: Phase A MVP - Ready for review
- **Branch**: phase-b-features - Phase B.1 backend complete, awaiting frontend

---

## 💡 Notes

- All Phase B features maintain Phase A backward compatibility
- Asset tracking is foundation for future wealth management features
- Transfer & allocation features require asset/wallet infrastructure
- Analytics build on data from phases B.1-B.2

---

**Last Updated**: September 22, 2026
**Status**: Phase B.1 Backend Complete, Awaiting Frontend

