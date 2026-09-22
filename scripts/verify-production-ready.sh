#!/bin/bash

# Production Readiness Verification Script
# Checks if the application is ready for production deployment

set -e

echo "🔍 Production Readiness Check - Phase A MVP"
echo "============================================="
echo ""

ERRORS=0
WARNINGS=0

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
check_pass() {
  echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
  echo -e "${RED}✗${NC} $1"
  ERRORS=$((ERRORS + 1))
}

check_warn() {
  echo -e "${YELLOW}⚠${NC} $1"
  WARNINGS=$((WARNINGS + 1))
}

# 1. Git Status Check
echo "📋 Git Status"
if git status --porcelain | grep -q .; then
  check_fail "Uncommitted changes detected"
else
  check_pass "Working directory clean"
fi

CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "main-yjl8ih" ]; then
  check_pass "On correct branch (main-yjl8ih)"
else
  check_warn "Not on main-yjl8ih branch (currently on $CURRENT_BRANCH)"
fi

# 2. Build Check
echo ""
echo "🔨 Build Status"
if [ -d "frontend/dist" ]; then
  SIZE=$(du -sh frontend/dist | cut -f1)
  check_pass "Frontend built ($SIZE)"
else
  check_fail "Frontend not built - run: cd frontend && npm run build"
fi

# 3. Dependencies Check
echo ""
echo "📦 Dependencies"
if [ -d "backend/node_modules" ]; then
  check_pass "Backend dependencies installed"
else
  check_warn "Backend node_modules not found - will be installed during deployment"
fi

if [ -d "frontend/node_modules" ]; then
  check_pass "Frontend dependencies installed"
else
  check_warn "Frontend node_modules not found - will be installed during deployment"
fi

# 4. Environment Configuration
echo ""
echo "⚙️  Environment Configuration"
if [ -f "backend/.env.example" ]; then
  check_pass "Environment template exists (.env.example)"
else
  check_fail "Missing .env.example"
fi

if [ -f "backend/.env" ]; then
  check_warn "Production .env exists locally - ensure it's not committed"
else
  check_pass ".env not in repo (good practice)"
fi

# 5. Docker Configuration
echo ""
echo "🐳 Docker Configuration"
if [ -f "Dockerfile" ]; then
  check_pass "Dockerfile exists"
else
  check_fail "Dockerfile not found"
fi

# Try to validate Dockerfile syntax
if command -v docker &> /dev/null; then
  if docker build -q --target frontend-build -f Dockerfile . &>/dev/null; then
    check_pass "Dockerfile validates"
  else
    check_fail "Dockerfile has syntax errors"
  fi
else
  check_warn "Docker not installed - cannot validate Dockerfile"
fi

# 6. Database Setup
echo ""
echo "🗄️  Database Setup"
if [ -f "backend/prisma/schema.prisma" ]; then
  check_pass "Prisma schema exists"

  # Check for Wallet model
  if grep -q 'model Wallet' backend/prisma/schema.prisma; then
    check_pass "Wallet model defined in schema"
  else
    check_fail "Wallet model not found in schema"
  fi
else
  check_fail "Prisma schema not found"
fi

if [ -d "backend/prisma/migrations/20260922_add_wallet_support" ]; then
  check_pass "Wallet migration created"
else
  check_fail "Wallet migration not found"
fi

if [ -f "backend/seed-wallets.js" ]; then
  check_pass "Wallet seed script exists"
else
  check_warn "Wallet seed script not found"
fi

# 7. Routes Check
echo ""
echo "🛣️  API Routes"
if grep -q "walletRoutes" backend/src/index.js; then
  check_pass "Wallet routes registered"
else
  check_fail "Wallet routes not registered in app.js"
fi

if grep -q "app.use('/api/wallets'" backend/src/index.js; then
  check_pass "Wallet endpoint mounted"
else
  check_fail "Wallet endpoint not mounted"
fi

# 8. Frontend Routes
echo ""
echo "🧭 Frontend Routes"
if grep -q "WalletPage" frontend/src/App.jsx; then
  check_pass "WalletPage imported in App.jsx"
else
  check_fail "WalletPage not imported"
fi

if grep -q "/wallets" frontend/src/App.jsx; then
  check_pass "Wallet route configured"
else
  check_fail "Wallet route not found"
fi

# 9. Component Files
echo ""
echo "📄 Frontend Components"
COMPONENTS=(
  "frontend/src/pages/DashboardPage.jsx"
  "frontend/src/pages/WalletPage.jsx"
  "frontend/src/pages/ExpensesPage.jsx"
  "frontend/src/pages/IncomePages.jsx"
)

for comp in "${COMPONENTS[@]}"; do
  if [ -f "$comp" ]; then
    SIZE=$(wc -l < "$comp")
    check_pass "$comp ($SIZE lines)"
  else
    check_fail "$comp not found"
  fi
done

# 10. Backend Route Files
echo ""
echo "🔗 Backend Route Files"
ROUTES=(
  "backend/src/routes/wallets.js"
  "backend/src/routes/expenses.js"
  "backend/src/routes/income.js"
  "backend/src/routes/dashboard.js"
)

for route in "${ROUTES[@]}"; do
  if [ -f "$route" ]; then
    check_pass "$(basename $route) exists"
  else
    check_fail "$(basename $route) not found"
  fi
done

# 11. Syntax Validation
echo ""
echo "✅ Syntax Validation"
if node -c backend/src/index.js 2>/dev/null; then
  check_pass "Backend syntax valid"
else
  check_fail "Backend has syntax errors"
fi

# 12. Commits Check
echo ""
echo "💾 Git Commits"
COMMIT_COUNT=$(git log main-yjl8ih --oneline | grep "Phase" | wc -l)
if [ "$COMMIT_COUNT" -ge 4 ]; then
  check_pass "All Phase A MVP commits present ($COMMIT_COUNT)"
else
  check_warn "Only $COMMIT_COUNT phase commits found (expected 4+)"
fi

# 13. Remote Status
echo ""
echo "🌐 Remote Repository"
REMOTE_BRANCH=$(git branch -r | grep main-yjl8ih)
if [ -n "$REMOTE_BRANCH" ]; then
  check_pass "main-yjl8ih exists on remote"
else
  check_fail "main-yjl8ih not pushed to remote"
fi

# 14. Documentation
echo ""
echo "📚 Documentation"
if [ -f "DEPLOYMENT.md" ]; then
  check_pass "DEPLOYMENT.md exists"
else
  check_fail "DEPLOYMENT.md not found"
fi

if [ -f "README.md" ]; then
  check_pass "README.md exists"
else
  check_warn "README.md not found"
fi

# Final Summary
echo ""
echo "============================================="
if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ Production Ready!${NC}"
else
  echo -e "${RED}❌ $ERRORS issues found${NC}"
fi

if [ $WARNINGS -gt 0 ]; then
  echo -e "${YELLOW}⚠️  $WARNINGS warnings${NC}"
fi

echo ""
echo "Summary:"
echo "- Errors: $ERRORS"
echo "- Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ]; then
  echo "🚀 Ready to deploy!"
  echo ""
  echo "Next steps:"
  echo "1. Set up production environment variables"
  echo "2. Build Docker image: docker build -t rumah-kas:phase-a-mvp ."
  echo "3. Deploy container with DATABASE_URL and other env vars"
  echo "4. Run migrations: npm run migrate"
  echo "5. Seed wallets: node backend/seed-wallets.js"
  echo "6. Verify health: curl http://localhost:5000/health"
  exit 0
else
  echo "❌ Fix errors before deploying"
  exit 1
fi
