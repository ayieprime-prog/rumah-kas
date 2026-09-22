require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('express-async-errors');

const { errorHandler, notFound } = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/auth');

// Import routes with error handling
let authRoutes, householdRoutes, expenseRoutes, incomeRoutes, budgetRoutes, goalRoutes, debtRoutes, dashboardRoutes, reportsRoutes, notificationRoutes, linkRoutes, maintenanceRoutes;
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
} catch (err) {
  routeLoadError = err.message;
  console.error('========================================================');
  console.error('⚠️  DEGRADED MODE: API routes failed to load');
  console.error('⚠️  Reason:', err.message);
  console.error('⚠️  Check /health - it will report routesLoaded: false');
  console.error('========================================================');
}

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
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

// Serve frontend build (single-service deployment)
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 RumahKas API running on http://localhost:${PORT}`);
  console.log(`🏠 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
});

module.exports = app;
