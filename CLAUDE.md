# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 📋 PROJECT OVERVIEW

**Pundi** — Family Financial Management SaaS Platform

A full-stack application enabling couples to manage household finances collaboratively with real-time tracking, budgeting, goal setting, debt management, and comprehensive financial reporting.

- **Status:** Production-Ready (on branch `main-yjl8ih`)
- **Production Freeze:** Active (2026-09-22) — only critical bugfixes allowed on main
- **Deployment:** Railway (rumah-kas-development.up.railway.app)
- **Tech Stack:** React 18 + Node.js/Express + PostgreSQL + Prisma ORM

---

## 🏗️ ARCHITECTURE OVERVIEW

### Monorepo Structure

```
rumah-kas/
├── backend/          # Node.js/Express server + API routes
├── frontend/         # React 18 + Vite SPA
└── package.json      # Root workspace (npm run dev launches both)
```

### Key Architectural Decisions

1. **Household-Centric Data Model**
   - All financial data belongs to a `Household` (e.g., "Rumah Keluarga Budi")
   - Multiple `User`s can access same household (ADMIN + MEMBER roles)
   - See: `backend/prisma/schema.prisma` (Household model is root aggregate)

2. **Income Locking System** (Unique Feature)
   - Income can be "locked" to expense categories (e.g., salary → household category)
   - Calculates available funds per category separately from free money
   - See: `backend/src/utils/incomeLock.js` for calculation logic

3. **Expense Tracking with Wallets**
   - Expenses/income can be assigned to wallets (Cash, Bank, Digital)
   - Wallet filtering on dashboard for user convenience
   - See: `backend/prisma/schema.prisma` (Wallet model)

4. **Audit Logging**
   - Every action logged to AuditLog table (append-only)
   - Tracks user, action type, table, before/after values
   - See: `backend/src/utils/audit.js`

### Backend Architecture

**Routes Structure:**
```
backend/src/routes/
├── auth.js           # Login/register/logout
├── dashboard.js      # Dashboard data aggregation
├── expenses.js       # CRUD + filtering
├── income.js         # CRUD + locking
├── wallets.js        # Wallet management
├── budgets.js        # Budget CRUD + analytics
├── goals.js          # Goal tracking
├── debts.js          # Debt management
├── transfers.js      # Inter-wallet transfers
├── recurring.js      # Recurring expense templates
├── journal.js        # Family journal entries
├── maintenance.js    # Maintenance/maintenance tracking
├── notifications.js  # Notification config
├── household.js      # Household settings
├── events.js         # Event calendar
└── ... (15+ routes total)
```

**Middleware Stack:**
- `auth.js` — JWT verification + role-based access control
- `errorHandler.js` — Global async error wrapper (prevents unhandled rejections)
- Helmet — Security headers
- CORS — Configured per FRONTEND_URL (not wildcard)
- Rate limiting — On login attempts

**Key Utilities:**
- `audit.js` — Log every state change with before/after diffs
- `incomeLock.js` — Calculate "locked" vs "free" money per category
- `notificationTriggers.js` — Trigger notifications on budget exceeded, etc.

### Frontend Architecture

**Page Structure:**
```
frontend/src/pages/
├── DashboardPage.jsx      # Main Beranda (overview, weather, shortcuts)
├── KeuanganPage.jsx       # Finance hub (expenses, income, wallets)
├── KalenderPage.jsx       # Calendar + events
├── ConversationCardsPage.jsx # Daily conversation prompts
├── JournalPage.jsx        # Family journal entries
├── ReportsPage.jsx        # Financial reports + PDF export
├── BudgetPage.jsx         # Budget tracking
├── GoalsPage.jsx          # Financial goals
├── DebtPage.jsx           # Debt management
├── MaintenancePage.jsx    # Maintenance tracking
└── SettingsPage.jsx       # Household settings
```

**Key Components:**
- React Router v6 for navigation
- Axios for API calls (configured in `api.js`)
- Recharts for data visualization
- Lucide icons for UI
- Tailwind CSS for styling (via theme variables)

**State Management:**
- React hooks (useState, useEffect)
- No Redux/Zustand — state kept local to components or passed via props
- localStorage for user preferences
- Custom event dispatchers (e.g., 'dashboard-refresh' event)

---

## 📚 DATABASE SCHEMA (22 Models)

### Core Models

| Model | Purpose | Key Fields |
|-------|---------|-----------|
| `Household` | Root aggregate (e.g., family unit) | id, name, currency, createdAt |
| `User` | Family members | id, email, password(hashed), name, role, householdId |
| `AuditLog` | Activity trail (append-only) | id, userId, action, tableName, oldValue, newValue |

### Financial Models

| Model | Purpose | Relationships |
|-------|---------|---|
| `Expense` | Individual expense | → ExpenseCategory, Wallet, Household |
| `Income` | Income entry (can be locked) | → Wallet, ExpenseCategory(lock), Household |
| `Budget` | Category budget limit | → ExpenseCategory, Household |
| `Goal` | Savings goal | → Household |
| `Debt` | Debt/loan tracking | → Household |
| `Wallet` | Cash, Bank, Digital | → Household, [Expense], [Income] |
| `Transfer` | Inter-wallet transfers | → Wallet(from/to), Household |

### Other Models

| Model | Purpose |
|-------|---------|
| `ExpenseCategory` | Custom categories (Makanan, Transport, dll) |
| `RecurringExpense` | Expense templates |
| `Asset` | Real estate, vehicles, etc. |
| `Event` | Calendar events |
| `JournalEntry` | Family journal posts |
| `MaintenanceItem` | Home/car maintenance |
| `ImportantLink` | Quick links |
| `Notification` | Alert settings |

### Key Relationships

```
Household (1) ←→ (many) User
         ├→ (many) Expense → ExpenseCategory
         ├→ (many) Income → [ExpenseCategory (lock)]
         ├→ (many) Budget → ExpenseCategory
         ├→ (many) Wallet
         ├→ (many) Transfer
         └→ (many) AuditLog
```

**Important:** All financial data filtered by `householdId` (multi-tenancy safety)

---

## 🚀 COMMON DEVELOPMENT COMMANDS

### Installation & Setup

```bash
# Install all dependencies (root + backend + frontend)
npm run install:all

# Backend setup
cd backend
npm run seed              # Seed initial data
npm run seed:dummy        # Add test data
npx prisma studio        # Open Prisma Studio (visual DB browser)
npm run migrate:dev       # Create new migration
```

### Development

```bash
# Start both backend (port 5000) + frontend (port 5173)
npm run dev

# Or run separately
npm run dev:backend       # Backend only (with nodemon)
npm run dev:frontend      # Frontend only (with Vite)
```

### Building

```bash
# Backend (no build needed)
npm run build:backend

# Frontend
npm run build:frontend    # Output: frontend/dist/

# Full build
npm run build
```

### Testing

```bash
# Backend unit tests
cd backend
npm test                  # Runs test suite

# Frontend tests
# NOTE: No frontend tests currently — this is a Phase 1 improvement item
```

### Production Deployment

```bash
cd backend
npm start                 # Runs migrations + seeds (if SEED_DUMMY_DATA=true) + starts server
```

---

## 💾 KEY ENVIRONMENT VARIABLES

### Backend (`.env`)

```bash
DATABASE_URL=postgresql://...
PORT=5000
FRONTEND_URL=http://localhost:5173      # CORS origin
NODE_ENV=development
```

### Frontend (optional, `.env`)

```bash
VITE_API_BASE_URL=http://localhost:5000  # API server URL
```

---

## 🔐 AUTHENTICATION FLOW

1. **Login** — Email + password → JWT token (stored in Authorization header)
2. **JWT Verification** — `auth.js` middleware checks token on protected routes
3. **Role-Based Access** — Routes check `user.role` (ADMIN vs MEMBER)
   - ADMIN: Can manage household settings, users
   - MEMBER: Can view/create expenses, income, etc.
4. **Household Scoping** — All queries filter by `householdId` from JWT payload

**Key Files:**
- `backend/src/middleware/auth.js` — Token verification
- `backend/src/routes/auth.js` — Login/register endpoints
- JWT payload includes: `userId`, `householdId`, `role`

---

## 📊 API ROUTE STRUCTURE

All routes mounted at `/api/*`:

```
POST   /api/auth/register          # Create household + user
POST   /api/auth/login             # Get JWT token
GET    /api/dashboard              # Dashboard data
GET/POST /api/expenses             # Expense CRUD
GET/POST /api/income               # Income CRUD
GET    /api/budgets                # Budget list
GET    /api/goals                  # Goal list
GET    /api/wallets                # Wallet list
GET    /api/reports/profit-loss    # P&L report
GET    /api/audit                  # Audit log (admin only)
... (15+ more routes)
```

**Response Format:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

**Error Responses:**
```json
{
  "success": false,
  "message": "Error message in Indonesian"
}
```

---

## 🎨 DESIGN SYSTEM & STYLING

**Tailwind CSS + Custom Theme Variables** (`frontend/src/theme.js`):

```javascript
// Core colors
PRIMARY = '#2F5D50'      // Green (action buttons)
AMBER = '#C68A2E'        // Orange (warnings)
DANGER = '#B23A2E'       // Red (errors)
INK = '#1C2422'          // Dark (text)
LEDGER = '#F6F4EE'       // Light (background)
```

**Spacing/Layout Conventions:**
- Use Tailwind utility classes (p-4, gap-3, etc.)
- Mobile-first responsive (sm:, md:, lg: breakpoints)
- Grid layouts for multi-column sections

**Typography:**
- Display font: serif (for headers)
- Body font: sans-serif (for content)
- Tabular numbers for currency values

---

## 🐛 KNOWN ISSUES & GOTCHAS

### Production Freeze (Since 2026-09-22)
- Only critical bugfixes allowed on `main-yjl8ih`
- New features require separate branch/PR workflow
- Check `PRODUCTION-FREEZE.md` for policy details

### Current Limitations

1. **No Frontend Tests** (0% coverage)
   - No Jest/Vitest setup
   - This is Phase 1 improvement item

2. **Missing Accessibility** 
   - Only 16 aria-labels across entire frontend
   - Need systematic addition of aria-labels, semantic HTML

3. **Large Components**
   - `DashboardPage.jsx`, `Reports.jsx` > 800 LOC each
   - Refactoring planned for Phase 2

4. **Silent Error Handling**
   - Some `.catch(() => {})` patterns swallow errors
   - Should log to console or fallback UI

5. **No TypeScript**
   - Pure JavaScript across codebase
   - Could migrate gradually

### Common Pitfalls

- **Always filter by `householdId`** when querying data (multi-tenancy safety)
- **JWT token expires** after time period — frontend needs refresh logic
- **Prisma migrations** must be run before querying new schema (check `npm start`)
- **Income locking** is complex — see `incomeLock.js` before modifying

---

## 🧪 TESTING STRATEGY (WIP)

### Backend Testing
- Location: `backend/test/`
- Framework: Jest (planned)
- Coverage: Core routes + utilities
- Run: `cd backend && npm test`

### Frontend Testing
- **NOT IMPLEMENTED YET** — Phase 1 item
- Recommended: Jest + React Testing Library
- Focus on: Critical flows (auth, transactions, reports)

### Manual Testing Checklist
- [ ] Login/logout flow
- [ ] Create/edit/delete expense
- [ ] Transfer between wallets
- [ ] Budget exceeded notification
- [ ] PDF export
- [ ] Mobile responsiveness
- [ ] Decimal handling (currency)

---

## 📱 RESPONSIVE DESIGN

**Breakpoints:**
- **Mobile** (<640px): Sidebar hidden (hamburger), single-column layout
- **Tablet** (640-1024px): Sidebar visible, 2-column layout
- **Desktop** (>1024px): Optimal multi-column layout

**Mobile Considerations:**
- Touch targets ≥44px (accessibility)
- Form inputs ≥16px (prevents zoom on iOS)
- Tables use horizontal scroll

---

## 🚢 DEPLOYMENT (Railway)

### Pre-Deployment Checklist
- [ ] All tests passing (when available)
- [ ] No console errors
- [ ] Environment variables configured
- [ ] Database backup taken
- [ ] Monitoring alerts active

### Build & Deploy
```bash
# Railway auto-deploys on push to main
# Build steps (defined in railway.json):
1. Install dependencies
2. Prisma migration (prisma migrate deploy)
3. Optional seed (if SEED_DUMMY_DATA=true)
4. Start Node.js server
```

### Environment Variables (Railway)
Set in Railway dashboard:
- `DATABASE_URL` — PostgreSQL connection
- `PORT` — Server port (default 5000)
- `FRONTEND_URL` — For CORS (e.g., https://app.pundi.com)
- `NODE_ENV` — Set to "production"

### Monitoring
- Check Railway dashboard for error logs
- CPU/memory usage
- Database connection pool

---

## 📝 GIT WORKFLOW

### Branch Strategy
- **main** — Production branch (frozen, only urgent fixes)
- **main-yjl8ih** — Development branch (active features)
- **feature/*** — Feature branches (from main-yjl8ih)
- **bugfix/*** — Bug fix branches (from main-yjl8ih)

### Commit Message Convention
```
[Type] Brief description

Optional longer explanation

Type: feat, fix, refactor, docs, style, test, chore
```

### Pull Request Process
1. Create feature branch from `main-yjl8ih`
2. Make changes + commit
3. Push to GitHub
4. Create PR with description
5. GitHub Actions CI/CD runs tests
6. Merge after approval
7. Auto-deploys to Railway

---

## 🔄 COMMON WORKFLOWS

### Adding a New Expense Category

1. **Backend:** No code change needed (user creates via API)
2. **Frontend:** CRUD form in `KeuanganPage.jsx`
3. **Database:** Auto-creates in `ExpenseCategory` table
4. **Audit:** Auto-logged in `AuditLog`

### Creating a Recurring Expense

1. User creates `RecurringExpense` template in UI
2. Backend stores frequency + amount
3. Optional: Scheduled job creates monthly instances (see `notificationTriggers.js`)

### Adding a New Report

1. Create new route in `backend/src/routes/reports.js`
2. Query aggregations + formatting
3. Add frontend page in `frontend/src/pages/`
4. Wire up navigation in `App.jsx`
5. Consider PDF export (use jsPDF library)

### Modifying Database Schema

```bash
cd backend

# 1. Edit backend/prisma/schema.prisma
# 2. Create migration
npm run migrate:dev

# 3. Migration creates backend/prisma/migrations/xxx/
# 4. Test locally with seed data
npm run seed:dummy

# 5. Deploy (Railway auto-runs prisma migrate deploy)
```

---

## 🚨 TROUBLESHOOTING

### "Cannot find module" after git pull
```bash
npm run install:all
cd backend && npm run migrate:dev
```

### Frontend not connecting to API
- Check `VITE_API_BASE_URL` in frontend `.env`
- Verify backend running on correct port (5000)
- Check CORS in `backend/index.js` (FRONTEND_URL)

### Database locked
```bash
# Reset Prisma cache
rm -rf backend/node_modules/.prisma
npm run migrate:dev
```

### JWT token expired
- Frontend should refresh via `POST /api/auth/refresh` (if implemented)
- Or logout + login again

---

## 📖 ADDITIONAL RESOURCES

- **README.md** — Project overview & quick start
- **PANDUAN-CLOUD.md** — Cloud deployment detailed guide
- **PRODUCTION-FREEZE.md** — Current development freeze policy
- **Audit Report** (`AUDIT_REPORT.md` in scratchpad) — Comprehensive code quality audit

---

## ✅ PHASE 1 IMPROVEMENTS (Current Sprint)

Based on code audit, prioritized improvements:

1. ✅ **Create CLAUDE.md** (this file) — 2 hours ✓
2. **Add Accessibility Attributes** — 2-3 days
   - Add aria-labels to all interactive elements
   - Use semantic HTML
   - Test with keyboard navigation

3. **Fix Error Handling** — 2-3 days
   - Replace `.catch(() => {})` with proper logging
   - Add Error Boundary in React
   - Add try-catch to Promise chains

### Phase 2: Important (3-4 weeks)
- Add frontend tests (Jest + React Testing Library)
- Refactor large components (Kasir.jsx, Reports.jsx)
- Complete API documentation

---

**Last Updated:** 2026-09-29
**For Questions:** Refer to README.md or check git log for context on decisions
