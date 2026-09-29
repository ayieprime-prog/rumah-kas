# RumahKas Performance Optimization Guide

## Executive Summary

Performance optimization strategy for RumahKas/Pundi family financial management app focusing on:
- Frontend load time improvements
- Backend response time optimization
- Database query efficiency
- Asset and code splitting
- Caching strategies

**Target Metrics:**
- Lighthouse Score: 90+
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- API Response Time: < 200ms

---

## Phase 1: Performance Audit & Baseline

### Frontend Performance Audit

#### 1. Current State Analysis

```bash
# Run Lighthouse audit
npm run build
npm run preview
# Access lighthouse metrics
```

**Check Metrics:**
- ✅ First Contentful Paint (FCP)
- ✅ Largest Contentful Paint (LCP)
- ✅ Time to Interactive (TTI)
- ✅ Cumulative Layout Shift (CLS)
- ✅ First Input Delay (FID)
- ✅ Bundle Size
- ✅ Unused CSS/JS

#### 2. Backend Performance Audit

```bash
# API response time monitoring
# Database query analysis
# Memory usage profiling
```

---

## Phase 2: Frontend Optimization

### 1. Code Splitting & Lazy Loading

#### Route-Based Code Splitting

```javascript
// frontend/src/App.jsx
import { lazy, Suspense } from 'react'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ExpensesPage = lazy(() => import('./pages/ExpensesPage'))
const ReportsPage = lazy(() => import('./pages/ReportsPage'))

// Lazy load routes
<Suspense fallback={<LoadingScreen />}>
  <Route path="/" element={<DashboardPage />} />
</Suspense>
```

**Benefits:**
- ✅ Reduce initial bundle size by 40-50%
- ✅ Faster initial page load
- ✅ Load only required routes

#### Component-Level Code Splitting

```javascript
// Split large components
const FinancialSummarySection = lazy(() => 
  import('./components/FinancialSummarySection')
)

// Load on demand
<Suspense fallback={<Skeleton />}>
  <FinancialSummarySection {...props} />
</Suspense>
```

### 2. Image Optimization

#### Image Format & Size

```javascript
// Use modern formats (WebP with fallback)
<picture>
  <source srcSet="image.webp" type="image/webp" />
  <img src="image.png" alt="Description" />
</picture>

// Responsive images
<img 
  srcSet="small.jpg 480w, medium.jpg 800w, large.jpg 1200w"
  sizes="(max-width: 600px) 480px, 800px"
  src="medium.jpg"
  alt="Description"
/>
```

#### Image Lazy Loading

```javascript
// Lazy load images
<img 
  src="image.jpg" 
  loading="lazy"
  alt="Description"
/>
```

**Optimization Targets:**
- ✅ Wallpaper images: Optimize to <50KB
- ✅ Icons: Use SVG or sprite sheets
- ✅ Compress all PNGs/JPGs
- ✅ Target: 30-40% image size reduction

### 3. Bundle Size Optimization

#### Analyze Bundle

```bash
# Analyze bundle composition
npm install --save-dev webpack-bundle-analyzer

# Check bundle size
npm run build
npm run analyze
```

**Target Bundle Sizes:**
- Initial JS: < 150KB (gzipped)
- CSS: < 50KB (gzipped)
- Total: < 200KB (gzipped)

#### Remove Unused Dependencies

```bash
# Check for unused packages
npm install --save-dev depcheck
npx depcheck

# Remove unused packages
npm uninstall package-name
```

**Candidates for Review:**
- Unused Lucide icons (use icon subsets)
- Unused charting libraries
- Duplicate dependencies

### 4. CSS Optimization

#### PurgeCSS / Tailwind Optimization

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx}",
  ],
  // Automatic unused CSS removal
}
```

**Expected:** 20-30% CSS reduction

#### Critical CSS Inlining

```html
<!-- Inline critical CSS for above-the-fold content -->
<style>
  /* Dashboard critical styles */
</style>
```

### 5. Caching Strategies

#### HTTP Caching Headers

```javascript
// backend/src/index.js
// Assets: Cache forever (with hash)
app.use(express.static('frontend/dist', {
  setHeaders: (res, filePath) => {
    if (filePath.includes('assets/')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    }
  }
}))

// HTML: No cache
res.setHeader('Cache-Control', 'no-cache')
```

#### Service Worker Caching

```javascript
// frontend/src/service-worker.js
const CACHE_NAME = 'rumahkas-v1'
const urlsToCache = [
  '/',
  '/index.html',
  '/api/dashboard' // Precache critical API
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache)
    })
  )
})
```

---

## Phase 3: Backend Optimization

### 1. Database Query Optimization

#### Identify Slow Queries

```sql
-- Enable query logging
SET log_statement = 'all';
SET log_duration = 'on';
SET log_min_duration_statement = 100; -- Log queries > 100ms
```

#### Query Optimization Techniques

```javascript
// Bad: N+1 queries
const expenses = await Expense.findAll()
expenses.forEach(e => {
  e.category = Category.findOne(e.categoryId) // N queries!
})

// Good: Join query
const expenses = await Expense.findAll({
  include: [{ association: 'category' }]
})

// Good: Select specific fields
const expenses = await Expense.findAll({
  attributes: ['id', 'amount', 'date', 'categoryId'],
  include: {
    association: 'category',
    attributes: ['id', 'name', 'color']
  }
})
```

#### Add Database Indexes

```javascript
// Prisma schema
model Expense {
  id        String    @id @default(cuid())
  date      DateTime  @db.Date
  userId    String
  
  // Add indexes for common queries
  @@index([userId, date])
  @@index([userId, createdAt])
}
```

### 2. API Response Optimization

#### Response Caching

```javascript
// Cache dashboard response
app.get('/api/dashboard', 
  async (req, res) => {
    // Check cache first
    const cached = cache.get(`dashboard:${req.user.id}`)
    if (cached) return res.json(cached)
    
    // Get fresh data
    const data = await getDashboardData(req.user.id)
    
    // Cache for 5 minutes
    cache.set(`dashboard:${req.user.id}`, data, 300)
    
    res.json(data)
  }
)
```

#### Pagination for Lists

```javascript
// Implement pagination
app.get('/api/expenses', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100)
  const offset = parseInt(req.query.offset) || 0
  
  const { rows, count } = await Expense.findAndCountAll({
    limit,
    offset,
    order: [['date', 'DESC']]
  })
  
  res.json({
    data: rows,
    count,
    limit,
    offset
  })
})
```

#### Compression

```javascript
// Enable gzip compression
const compression = require('compression')
app.use(compression())
```

### 3. Backend Performance Monitoring

```javascript
// Add performance monitoring middleware
app.use((req, res, next) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    if (duration > 200) {
      console.warn(`Slow request: ${req.method} ${req.path} took ${duration}ms`)
    }
  })
  
  next()
})
```

---

## Phase 4: React Performance Optimization

### 1. Component Memoization

```javascript
// Memoize expensive components
import { memo } from 'react'

const FinancialSummary = memo(({ data }) => {
  return <div>{/* Expensive rendering */}</div>
})

export default FinancialSummary
```

### 2. useMemo & useCallback

```javascript
import { useMemo, useCallback } from 'react'

function DashboardPage() {
  // Memoize expensive calculations
  const totalGoals = useMemo(() => {
    return goals.reduce((sum, g) => sum + g.currentAmount, 0)
  }, [goals])
  
  // Memoize callbacks to prevent child re-renders
  const handleAddExpense = useCallback(async (data) => {
    await api.post('/expenses', data)
  }, [])
}
```

### 3. Virtual Scrolling for Lists

```javascript
// Use virtual scrolling for large lists
import { FixedSizeList } from 'react-window'

const ExpensesList = ({ expenses }) => (
  <FixedSizeList
    height={600}
    itemCount={expenses.length}
    itemSize={60}
  >
    {({ index, style }) => (
      <div style={style}>
        {expenses[index].category}: Rp {expenses[index].amount}
      </div>
    )}
  </FixedSizeList>
)
```

---

## Phase 5: Monitoring & Metrics

### 1. Web Vitals Monitoring

```javascript
// frontend/src/utils/webVitals.js
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

export function reportWebVitals(onPerfEntry) {
  getCLS(onPerfEntry)
  getFID(onPerfEntry)
  getFCP(onPerfEntry)
  getLCP(onPerfEntry)
  getTTFB(onPerfEntry)
}

// Track in analytics/logging service
reportWebVitals((metric) => {
  console.log(metric)
  // Send to analytics
})
```

### 2. API Performance Tracking

```javascript
// Track API response times
axios.interceptors.response.use(response => {
  const duration = response.config.duration
  if (duration > 200) {
    console.warn(`Slow API: ${response.config.url} took ${duration}ms`)
  }
  return response
})
```

---

## Performance Targets

### Frontend

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| LCP (Largest Contentful Paint) | < 1.5s | TBD | TBD |
| FID (First Input Delay) | < 100ms | TBD | TBD |
| CLS (Cumulative Layout Shift) | < 0.1 | TBD | TBD |
| Bundle Size (JS) | < 150KB | TBD | TBD |
| Bundle Size (CSS) | < 50KB | TBD | TBD |
| Lighthouse Score | 90+ | TBD | TBD |

### Backend

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| API Response Time | < 200ms | TBD | TBD |
| Database Query Time | < 50ms | TBD | TBD |
| Memory Usage | < 512MB | TBD | TBD |
| Throughput | 100+ req/s | TBD | TBD |

---

## Implementation Roadmap

### Week 1: Frontend Optimization
- [ ] Code splitting & lazy loading
- [ ] Image optimization
- [ ] Bundle analysis
- [ ] CSS purging

### Week 2: Backend Optimization
- [ ] Query optimization
- [ ] Add database indexes
- [ ] Response caching
- [ ] Compression setup

### Week 3: React Optimization
- [ ] Component memoization
- [ ] useMemo & useCallback
- [ ] Virtual scrolling
- [ ] Re-render optimization

### Week 4: Monitoring & Testing
- [ ] Web Vitals tracking
- [ ] Performance benchmarks
- [ ] Load testing
- [ ] Documentation

---

## Tools & Resources

### Frontend Tools
```bash
npm install --save-dev webpack-bundle-analyzer
npm install --save-dev lighthouse
npm install --save-dev web-vitals
```

### Backend Tools
```bash
# Database query analysis
# Redis for caching
npm install redis
```

### Monitoring
```bash
npm install web-vitals
npm install react-window  # Virtual scrolling
```

---

## Success Criteria

✅ Lighthouse Score: 90+  
✅ LCP: < 1.5 seconds  
✅ Bundle Size: < 200KB (gzipped)  
✅ API Response: < 200ms  
✅ Zero Core Web Vitals failures  
✅ Database queries: < 50ms average  

---

**Next Steps:** Start with Phase 1 audit, then implement improvements in priority order.
