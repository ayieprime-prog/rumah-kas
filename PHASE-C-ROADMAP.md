# Phase C Development Roadmap — Rumah Kas

**Status:** 🚀 Development starting  
**Branch:** `phase-c-features`  
**Parallel Track:** Deployment to Railway (master branch stable)

---

## 📌 Phase C Scope

Advanced features that enhance user experience and provide deeper insights into household finances.

---

## 🎯 Phase C.1 — Financial Reports & PDF Export

**Objective:** Generate comprehensive financial reports with PDF export capability

### Backend
- [ ] Report generation endpoints
  - `GET /api/reports/summary?month=YYYY-MM` - Monthly financial summary
  - `GET /api/reports/annual?year=YYYY` - Annual summary
  - `GET /api/reports/expense-breakdown` - Detailed expense analysis
  - `GET /api/reports/income-sources` - Income source breakdown
- [ ] Report data aggregation logic
- [ ] PDF generation service (using pdfkit or similar)

### Frontend
- [ ] ReportsPage redesign with filters
  - Month/year selector
  - Report type selector (monthly, annual, custom)
  - Download PDF button
- [ ] Report visualization
  - Summary cards (total income, expenses, savings, net)
  - Period comparison charts
  - Category breakdown tables
- [ ] PDF preview modal

### Database
- No schema changes needed (use existing data)

**Estimated:** 4-5 hours  
**Priority:** High (useful for tax prep, financial planning)

---

## 🎯 Phase C.2 — Multi-Device Sync & Offline Mode

**Objective:** Sync data across devices and work offline with background sync

### Backend
- [ ] Sync API endpoints
  - `POST /api/sync/pull` - Get changes since last sync
  - `POST /api/sync/push` - Upload local changes
  - Conflict resolution for concurrent edits
- [ ] Sync metadata (last-sync timestamp)
- [ ] Change tracking (audit log enhancement)

### Frontend
- [ ] Service worker enhancement
  - Cache strategy for offline mode
  - Background sync when online
- [ ] Sync status indicator
- [ ] Offline indicator in UI
- [ ] Queue management for offline changes
- [ ] Conflict resolution UI

### Database
- [ ] Add sync_version to key tables (expenses, income, budgets, goals)
- [ ] Migration for backward compatibility

**Estimated:** 6-8 hours  
**Priority:** Medium (nice-to-have, improves mobile experience)

---

## 🎯 Phase C.3 — Mobile-Optimized App Shell

**Objective:** Create a better mobile experience with app-like behavior

### Frontend
- [ ] Responsive redesign optimizations
  - Touch-friendly buttons & spacing
  - Bottom navigation enhancement
  - Swipe gestures for navigation
  - Haptic feedback integration
- [ ] PWA improvements
  - App install prompt
  - Splash screen
  - Icon & theme customization
- [ ] Mobile-specific pages
  - Quick add widget for expenses/income
  - Mini dashboard card
  - Mobile wallet switcher

### No Backend Changes

**Estimated:** 3-4 hours  
**Priority:** Medium (improves UX on mobile)

---

## 🎯 Phase C.4 — Bank API Integration & Auto-Import

**Objective:** Connect to bank APIs for automatic transaction import

### Backend
- [ ] Bank API connector service
  - Support for common banks (OVO, GCash, etc via Xendit/Midtrans APIs)
  - Transaction fetch & sync
  - Category auto-mapping
- [ ] Integration settings storage
  - Encrypted bank credentials
  - Integration status & health checks
- [ ] Auto-categorization logic
  - ML-based or rule-based category assignment

### Frontend
- [ ] Settings page integration
  - Connect bank account flow
  - Manage connected accounts
  - Auto-categorization settings
  - Transaction review/approve before import
- [ ] Import history page
  - View imported transactions
  - Undo/delete imported items
  - Review auto-categorization

### Database
- [ ] BankIntegration model
  - account_id, bank_name, encrypted_credentials, status
  - last_sync_at, next_sync_at
- [ ] TransactionImport model
  - Link imported transactions back to source

**Estimated:** 8-10 hours  
**Priority:** Low (future enhancement, complex)

---

## 🎯 Phase C.5 — Notifications & Reminders

**Objective:** Proactive alerts for financial events

### Backend
- [ ] Notification service
  - Budget alerts (90%, 100%, exceeded)
  - Goal milestone notifications
  - Recurring payment reminders
  - Bill due notifications
- [ ] Notification storage
  - Read/unread status
  - Notification history
- [ ] Email/push integration setup

### Frontend
- [ ] Notification center
  - Unread badge
  - Dismiss/archive notifications
  - Notification preferences page
- [ ] Toast notifications for events

### Database
- [ ] Notification model (if not already exists)
  - type, title, message, read_at, created_at

**Estimated:** 3-4 hours  
**Priority:** Medium (improves engagement)

---

## 📊 Phase C Priority & Timeline

### Quick Wins (High Priority)
1. **C.1** — Reports & PDF Export (4-5 hrs)
   - Immediate value for users
   - Good for tax season
   
2. **C.5** — Notifications (3-4 hrs)
   - Low effort, high engagement
   - Helps users stay on top of finances

### Medium Priority
3. **C.3** — Mobile UX (3-4 hrs)
   - Improves mobile experience
   - No backend work needed

4. **C.2** — Sync & Offline (6-8 hrs)
   - Complex but useful
   - Improves reliability

### Future (Lower Priority)
5. **C.4** — Bank Integration (8-10 hrs)
   - Requires API partnerships
   - Can be done later

---

## 🔄 Development Workflow

### Branch Strategy
```
master (production-ready, Phase B.1-B.4)
  ├── phase-c-features (active development)
  │   ├── c1-reports (Phase C.1 work)
  │   ├── c2-sync (Phase C.2 work)
  │   ├── c3-mobile (Phase C.3 work)
  │   └── ...
```

### Process for Each Phase
1. Create sub-branch from `phase-c-features` (e.g., `c1-reports`)
2. Implement & test feature
3. Create PR to `phase-c-features`
4. Review & merge
5. When C.1 is done, merge `phase-c-features` → `master`
6. Deploy to production

### Parallel with Deployment
- **Track A:** Deploy Phase B to production (master, stable)
- **Track B:** Develop Phase C (phase-c-features, new features)
- No conflicts since they're separate branches

---

## ✅ Acceptance Criteria

### Phase C.1 (Reports)
- [ ] All report endpoints working
- [ ] PDF generation tested
- [ ] Frontend displays reports correctly
- [ ] Export works on mobile

### Phase C.2 (Sync)
- [ ] Sync API endpoints functional
- [ ] Service worker caches correctly
- [ ] Offline changes queue properly
- [ ] Conflict resolution works

### Phase C.3 (Mobile)
- [ ] Touch targets ≥48px
- [ ] Responsive layout verified
- [ ] All gestures work
- [ ] Mobile performance good

### Phase C.4 (Bank API)
- [ ] Bank auth flow works
- [ ] Transactions imported correctly
- [ ] Auto-categorization accurate
- [ ] Settings page functional

### Phase C.5 (Notifications)
- [ ] All notification types trigger
- [ ] Email/push delivery works
- [ ] Notification center displays correctly
- [ ] Preferences respected

---

## 🚀 Estimated Timeline

| Phase | Hours | Difficulty | Priority |
|-------|-------|-----------|----------|
| C.1 - Reports | 4-5 | Medium | 🔴 High |
| C.2 - Sync | 6-8 | Hard | 🟡 Medium |
| C.3 - Mobile | 3-4 | Low | 🟡 Medium |
| C.4 - Bank API | 8-10 | Very Hard | 🟢 Low |
| C.5 - Notifications | 3-4 | Low | 🟡 Medium |
| **Total** | **~30 hours** | — | — |

**Realistic delivery:** 2-3 weeks with part-time work, 1 week with full-time focus

---

## 📚 Tech Stack Additions

- **PDF Generation:** pdfkit or jsPDF
- **Service Worker:** Already using (enhance existing)
- **Notifications:** Resend (email) + FCM/Expo (push)
- **Bank APIs:** Xendit, Midtrans, or similar gateway
- **Sync Library:** TBD (custom or existing like Realm)

---

## 🔗 Related Documentation

- [RAILWAY-DEPLOYMENT-CHECKLIST.md](./RAILWAY-DEPLOYMENT-CHECKLIST.md) — Parallel track for production deployment
- [NEXT-STEPS.md](./NEXT-STEPS.md) — Phase B testing & go-live plan
- [PHASE-B-ROADMAP.md](./PHASE-B-ROADMAP.md) — What was completed in Phase B

---

## 📝 Notes

- Phase C.1 & C.5 should be done first (quick wins)
- Phase C.2 & C.3 can run in parallel after Phase C.1
- Phase C.4 can wait until after deployment is stable
- Keep `master` branch stable for production deployment in parallel

---

**Status:** Ready to start Phase C.1  
**Next Action:** Begin with Reports & PDF Export (C.1)

🚀 **Let's build Phase C!**
