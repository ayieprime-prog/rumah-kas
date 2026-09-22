# Rumah Kas — Parallel Tracks: Deployment + Development

**Status:** 🚀 Two tracks running simultaneously  
**Started:** 2026-09-22

---

## 📊 Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    RUMAH KAS PROJECT                        │
├──────────────────────────────────┬──────────────────────────┤
│                                  │                          │
│   TRACK A: PRODUCTION DEPLOYMENT │  TRACK B: DEVELOPMENT   │
│   (master branch — STABLE)       │  (phase-c-features)     │
│                                  │                          │
├──────────────────────────────────┼──────────────────────────┤
│ Phase B.1-B.4 → Railway          │ Phase C.1 → Reports      │
│ ├─ Dev Environment Setup         │ ├─ PDF Export           │
│ ├─ Prod Environment Setup        │ ├─ Backend endpoints    │
│ ├─ Developer Testing (1 hr)      │ ├─ Frontend UI          │
│ ├─ Spouse UAT (1-2 hrs)          │ └─ Testing              │
│ ├─ Bug Fixes                     │                         │
│ └─ Go-Live 🎉                   │ Then: Phase C.2-C.5     │
│                                  │                         │
│ Estimated: 4-6 hours            │ Estimated: 2-3 weeks   │
│ Owner: Primary focus            │ Owner: Parallel work    │
└──────────────────────────────────┴──────────────────────────┘
```

---

## 🔀 Git Workflow

### Master Branch (Production)
```
master (ALWAYS STABLE)
├── Commit: Phase B.4 (last working version)
├── Deployment: Push to Railway when ready
├── Status: Production-only changes allowed
└── Branches: Only hotfixes (hotfix/issue-name)
```

### Phase C Branch (Development)
```
phase-c-features (ACTIVE DEVELOPMENT)
├── Commit: PHASE-C-ROADMAP.md
├── Sub-branches:
│   ├── c1-reports (Phase C.1 work)
│   ├── c2-sync (Phase C.2 work)
│   └── ...
├── Status: Features in development
└── Merge to master: After each phase complete + tested
```

**Key Rule:** Master and phase-c-features NEVER conflict. Keep them separate.

---

## 📅 Timeline

### Week 1: Deployment (Track A)

```
Day 1 (Monday):
├─ 08:00 - Create Railway dev environment (15 min)
├─ 08:15 - Create Railway prod environment (15 min)
├─ 08:30 - Test backend endpoints (10 min)
├─ 08:40 - Frontend local testing (20 min)
├─ 09:00 - Developer testing Phase 1 (1 hour)
└─ 10:00 - BREAK

Day 1 (Afternoon):
├─ 14:00 - Spouse UAT Phase 2 (1-2 hours)
├─ 16:00 - Document bugs
├─ 16:30 - Fix critical bugs (1-2 hours)
├─ 18:00 - Re-test
└─ 18:30 - Go-live 🚀
```

**Key Milestones:**
- Day 1: Environments set up ✅
- Day 1: Testing complete ✅
- Day 1: Go-live 🎉

### Week 1-2: Phase C Development (Track B)

```
Parallel with deployment (can start anytime):

Start: Phase C.1 (Reports & PDF) — 4-5 hours
├─ Backend: Report endpoints
├─ Frontend: Reports UI
├─ Testing
└─ Commit to phase-c-features

Then: Phase C.5 (Notifications) — 3-4 hours
├─ Backend: Notification service
├─ Frontend: Notification center
└─ Testing

Then: Phase C.3 (Mobile UX) — 3-4 hours
```

---

## 🎯 Track A: Deployment (Master Branch)

### Current Status
- ✅ Phase B.1-B.4 complete
- ✅ Code quality verified
- ⏳ Railway environments not yet created

### Next Steps (In Order)

**1. Create Dev Environment on Railway**
- Follow: [RAILWAY-DEPLOYMENT-CHECKLIST.md](./RAILWAY-DEPLOYMENT-CHECKLIST.md)
- Time: 15 minutes
- Output: Dev URL (e.g., `rumah-kas-dev.railway.app`)

**2. Create Prod Environment on Railway**
- Follow: Same checklist
- Time: 15 minutes
- Output: Prod URL (e.g., `rumah-kas-prod.railway.app`)
- ⚠️ Use DIFFERENT JWT_SECRET than dev!

**3. Test Backend**
- Call endpoints on both environments
- Verify: Health, Register, Login, Dashboard
- Time: 10 minutes per environment

**4. Test Frontend (Local)**
- Point to dev backend
- Register, login, navigate
- Time: 20 minutes

**5. Developer Testing (Phase 1)**
- Follow: [USER-TESTING-GUIDE.md](./USER-TESTING-GUIDE.md)
- Test all features
- Document bugs
- Time: 1 hour

**6. Spouse UAT (Phase 2)**
- Let spouse test
- Collect feedback
- Document bugs
- Time: 1-2 hours

**7. Bug Fixes**
- Fix critical bugs
- Test fixes
- Re-deploy
- Time: 1-2 hours (or more if many bugs)

**8. Go-Live 🚀**
- Announce production is live
- Share prod URL with spouse
- Monitor for issues

**Checklist:** [DEPLOYMENT-PREP.md](./DEPLOYMENT-PREP.md)

---

## 🎯 Track B: Development (phase-c-features Branch)

### Current Status
- ✅ Branch created
- ✅ Phase C roadmap written
- ⏳ Development not yet started

### Development Plan

**Phase C.1 — Reports & PDF Export** (4-5 hours)
```bash
# Start
git checkout -b c1-reports origin/phase-c-features

# Implement
# 1. Backend report endpoints (/api/reports/*)
# 2. Report data aggregation logic
# 3. PDF generation service
# 4. Frontend reports page
# 5. Download PDF button
# 6. Testing

# Finish
git commit -m "Phase C.1: Reports & PDF Export"
git push origin c1-reports
# Create PR to phase-c-features
# Merge after review
```

**Phase C.5 — Notifications** (3-4 hours)
```bash
git checkout -b c5-notifications origin/phase-c-features
# Similar process...
git commit -m "Phase C.5: Notifications & Reminders"
```

**Phase C.3 — Mobile UX** (3-4 hours)
```bash
git checkout -b c3-mobile origin/phase-c-features
# Similar process...
```

**After Complete:** Merge phase-c-features → master for production release

**Details:** [PHASE-C-ROADMAP.md](./PHASE-C-ROADMAP.md)

---

## 🔄 Workflow: How They Interact

### Scenario 1: Bug Found During Testing

**If bug found in Track A (Deployment):**

```
1. Don't modify master (it's for deployment)
2. Create branch: git checkout -b bugfix/[issue-name] master
3. Fix the bug
4. Test in dev environment
5. Create PR: bugfix branch → master
6. Merge when approved
7. Railway auto-deploys
8. Re-test in dev, then move to prod
```

**If bug found in Track B (Development):**

```
1. Fix in phase-c-features branch (already active)
2. No impact on master/deployment
3. Test thoroughly before merging to master
```

### Scenario 2: Merging Phase C to Production

**When Phase C.1 is complete:**

```
1. Ensure phase-c-features has Phase C.1 merged
2. Test C.1 feature thoroughly
3. Create PR: phase-c-features → master
4. Review & merge
5. Railway auto-deploys to prod
6. Users get Phase C.1 features!
```

### Scenario 3: Hotfix During Development

**If critical bug in production found during Track B work:**

```
1. Don't interrupt Track B
2. Create hotfix branch: git checkout -b hotfix/critical-issue master
3. Fix & test immediately
4. Merge to master ASAP
5. Railway deploys fix
6. Continue with Track B work
```

---

## 📊 Expected Outcomes

### Track A Success Criteria

- [ ] Dev environment created successfully
- [ ] Prod environment created successfully
- [ ] Both environments pass all tests
- [ ] Developer testing completed (Phase 1)
- [ ] Spouse UAT completed (Phase 2)
- [ ] All critical bugs fixed
- [ ] Go-live successful
- [ ] Production working smoothly for 48+ hours

### Track B Success Criteria

- [ ] Phase C.1 (Reports) complete & tested
- [ ] Phase C.5 (Notifications) complete & tested
- [ ] Code quality high (no console errors)
- [ ] Features work in dev & prod
- [ ] Users report satisfaction

---

## ⚠️ Important Notes

### What NOT to Do

❌ **Don't push Phase C code to master** — Use phase-c-features branch  
❌ **Don't skip testing** — Always test before deploying  
❌ **Don't use same JWT_SECRET** — Dev and prod must differ  
❌ **Don't modify deployed version** — Always use GitHub → Railway pipeline  

### Best Practices

✅ **Keep master always deployable** — Only tested code  
✅ **Test in dev first** — Before moving to prod  
✅ **Use separate branches** — One feature per branch  
✅ **Document bugs clearly** — Screenshots + steps to reproduce  
✅ **Communicate with spouse** — For UAT feedback  

---

## 📞 Quick Reference

### Important URLs

| Environment | URL | Database | JWT_Secret |
|-------------|-----|----------|-----------|
| Dev | `rumah-kas-dev.railway.app` | PostgreSQL (dev) | [random-dev] |
| Prod | `rumah-kas-prod.railway.app` | PostgreSQL (prod) | [random-prod] |
| Local | `localhost:3000` | Local DB | — |

### Git Commands Cheat Sheet

```bash
# Work on Track A (Deployment)
git checkout master                      # Go to master
git status                               # Check status
git log --oneline -1                     # See last commit

# Work on Track B (Development)
git checkout phase-c-features            # Go to dev branch
git checkout -b c1-reports               # Create feature branch
git add . && git commit -m "..."         # Commit changes
git push origin c1-reports               # Push to GitHub

# Merge back
git checkout phase-c-features
git merge c1-reports                     # Merge feature
git push origin phase-c-features         # Push

# Later, merge to production
git checkout master
git merge phase-c-features               # Merge to master
```

---

## 🎯 Success Metrics

After both tracks complete:

```
TRACK A: Production Deployment
├─ ✅ Dev environment live and tested
├─ ✅ Prod environment live and tested
├─ ✅ Users can register and login
├─ ✅ Dashboard displays correct data
├─ ✅ All Phase B features working
└─ ✅ Zero critical bugs

TRACK B: Phase C Development
├─ ✅ Phase C.1 (Reports) complete
├─ ✅ Phase C.5 (Notifications) complete
├─ ✅ Code passes review
├─ ✅ Ready to merge for next release
└─ ✅ Features tested in dev
```

---

## 🚀 Let's Go!

### Start Immediately

1. **For Track A (Deployment):**
   → Open [DEPLOYMENT-PREP.md](./DEPLOYMENT-PREP.md) → Follow Step 2

2. **For Track B (Development):**
   → Open [PHASE-C-ROADMAP.md](./PHASE-C-ROADMAP.md) → Start Phase C.1

Both can run simultaneously. No conflicts. Maximum efficiency! 🎉

---

**Status:** 🟢 Ready to start both tracks  
**Last Updated:** 2026-09-22

Let's make Rumah Kas production-ready and feature-rich! 💪
