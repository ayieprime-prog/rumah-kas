require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
require('express-async-errors');

const { errorHandler, notFound } = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/auth');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../openapi.json');

// Import routes with error handling
let authRoutes, householdRoutes, expenseRoutes, incomeRoutes, budgetRoutes, goalRoutes, debtRoutes, dashboardRoutes, reportsRoutes, notificationRoutes, linkRoutes, maintenanceRoutes, eventRoutes, journalRoutes, auditLogRoutes, walletRoutes, assetRoutes, transferRoutes, allocationRoutes, budgetAnalyticsRoutes, performanceRoutes, categoryRoutes, recurringRoutes;
let routeLoadError = null;

try {
  authRoutes = require('./routes/auth');
  householdRoutes = require('./routes/household');
  expenseRoutes = require('./routes/expenses');
  incomeRoutes = require('./routes/income');
  budgetRoutes = require('./routes/budget');
  goalRoutes = require('./routes/goals');
  debtRoutes = require('./routes/debt');
  dashboardRoutes = require('./routes/dashboard');
  reportsRoutes = require('./routes/reports');
  notificationRoutes = require('./routes/notifications');
  linkRoutes = require('./routes/links');
  maintenanceRoutes = require('./routes/maintenance');
  eventRoutes = require('./routes/events');
  journalRoutes = require('./routes/journal');
  auditLogRoutes = require('./routes/auditlog');
  walletRoutes = require('./routes/wallets');
  assetRoutes = require('./routes/assets');
  transferRoutes = require('./routes/transfers');
  allocationRoutes = require('./routes/allocation');
  budgetAnalyticsRoutes = require('./routes/budgetanalytics');
  performanceRoutes = require('./routes/performance');
  categoryRoutes = require('./routes/categories');
  recurringRoutes = require('./routes/recurring');
} catch (err) {
  routeLoadError = err.message;
  console.error('========================================================');
  console.error('⚠️  DEGRADED MODE: API routes failed to load');
  console.error('⚠️  Reason:', err.message);
  console.error('⚠️  Check /health - it will report routesLoaded: false');
  console.error('========================================================');
}

// Push notifications + periodic sync are optional add-ons (require the
// `web-push` / `node-cron` packages). Loaded in their own try/catch so a
// missing dependency only disables these features instead of putting the
// entire API in degraded mode like the block above would.
let pushNotificationRoutes = null;
let syncScheduler = null;
try {
  pushNotificationRoutes = require('./routes/notifications.route');
  syncScheduler = require('./services/syncScheduler');
} catch (err) {
  console.error('⚠️  Push notifications / background sync disabled:', err.message);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Railway (dan proxy cloud lain) meneruskan permintaan lewat reverse proxy --
// tanpa ini, express-rate-limit menolak header X-Forwarded-For dan setiap
// request ke /api/* gagal dengan ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
app.set('trust proxy', 1);

// Security middleware. helmet()'s default CSP leaves connect-src unset,
// which falls back to default-src 'self' -- that silently blocks the
// browser-side fetch() calls this app makes to external APIs (weather,
// geocoding). img-src already allows data: by default, which is what
// wallpaper needs.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'connect-src': [
        "'self'",
        'https://api.open-meteo.com',
        'https://geocoding-api.open-meteo.com',
        'https://api.bigdatacloud.net'
      ]
    }
  }
}));

// CORS_ORIGIN boleh berisi beberapa origin dipisah koma (mis. localhost dev +
// domain Railway) -- cors() cuma menerima array atau satu string origin
// tunggal, jadi harus di-split dulu, kalau tidak semua origin selalu ditolak.
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim());
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // 100 requests per windowMs
});
app.use('/api/', limiter);

// Stricter limiter for auth endpoints to slow down brute-force login/register attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    mode: routeLoadError ? 'degraded' : 'full',
    routesLoaded: !routeLoadError,
    routeLoadError: routeLoadError || undefined,
    timestamp: new Date().toISOString(),
    db: process.env.DATABASE_URL ? 'configured' : 'not_configured'
  });
});

// Swagger UI - API Documentation (accessible without auth for reference)
app.use('/api/docs', swaggerUi.serve);
app.get('/api/docs', swaggerUi.setup(swaggerDocument, {
  swaggerOptions: {
    docExpansion: 'list',
    defaultModelsExpandDepth: 1,
    displayOperationId: true
  }
}));

// Public routes
if (authRoutes) app.use('/api/auth', authRoutes);

// Protected routes (require authentication)
if (householdRoutes) app.use('/api/household', authenticate, householdRoutes);
if (expenseRoutes) app.use('/api/expenses', authenticate, expenseRoutes);
if (incomeRoutes) app.use('/api/income', authenticate, incomeRoutes);
if (budgetRoutes) app.use('/api/budget', authenticate, budgetRoutes);
if (goalRoutes) app.use('/api/goals', authenticate, goalRoutes);
if (debtRoutes) app.use('/api/debt', authenticate, debtRoutes);
if (dashboardRoutes) app.use('/api/dashboard', authenticate, dashboardRoutes);
if (reportsRoutes) app.use('/api/reports', authenticate, reportsRoutes);
if (notificationRoutes) app.use('/api/notifications', authenticate, notificationRoutes);
if (linkRoutes) app.use('/api/links', authenticate, linkRoutes);
if (maintenanceRoutes) app.use('/api/maintenance', authenticate, maintenanceRoutes);
if (eventRoutes) app.use('/api/events', authenticate, eventRoutes);
if (journalRoutes) app.use('/api/journal', authenticate, journalRoutes);
if (auditLogRoutes) app.use('/api/activity', authenticate, auditLogRoutes);
if (walletRoutes) app.use('/api/wallets', authenticate, walletRoutes);
if (assetRoutes) app.use('/api/assets', authenticate, assetRoutes);
if (transferRoutes) app.use('/api/transfers', authenticate, transferRoutes);
if (allocationRoutes) app.use('/api/allocation', authenticate, allocationRoutes);
if (budgetAnalyticsRoutes) app.use('/api/budget-analytics', authenticate, budgetAnalyticsRoutes);
if (performanceRoutes) app.use('/api/performance', authenticate, performanceRoutes);
if (categoryRoutes) app.use('/api/categories', authenticate, categoryRoutes);
if (recurringRoutes) app.use('/api/recurring', authenticate, recurringRoutes);
if (pushNotificationRoutes) app.use('/api/push-notifications', authenticate, pushNotificationRoutes);

// Serve frontend build (single-service deployment). Vite fingerprints every
// file under assets/ with a content hash, so those are safe to cache forever
// -- a new build always gets new filenames. index.html is NOT hashed and is
// what tells the browser which hashed files to load, so it must never be
// cached, or the browser can keep showing an old build indefinitely after a
// deploy (this bit us: users needed a manual "?v=2" cache-bust to see updates).
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist, {
  index: false,
  setHeaders: (res, filePath) => {
    res.setHeader('Cache-Control', filePath.includes(`${path.sep}assets${path.sep}`)
      ? 'public, max-age=31536000, immutable'
      : 'no-cache');
  }
}));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Pundi API running on http://localhost:${PORT}`);
  console.log(`🏠 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);

  if (syncScheduler) {
    syncScheduler.start();
  }
});

module.exports = app;
