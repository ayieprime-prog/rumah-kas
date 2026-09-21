require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('express-async-errors');

const { errorHandler, notFound } = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/auth');

// Import routes with error handling
let authRoutes, householdRoutes, expenseRoutes, incomeRoutes, budgetRoutes, goalRoutes, debtRoutes, dashboardRoutes, reportsRoutes, notificationRoutes;

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
} catch (err) {
  console.error('⚠️ Warning: Could not load routes -', err.message);
  console.error('ℹ️ This is expected if DATABASE_URL is not configured yet');
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

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), db: process.env.DATABASE_URL ? 'configured' : 'not_configured' });
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
