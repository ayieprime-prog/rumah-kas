// Minimal server - no Prisma dependency
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DATABASE_URL ? 'configured' : 'not_configured'
  });
});

// Status endpoint
app.get('/api/status', (req, res) => {
  res.json({ status: 'RumahKas API running', version: '1.0.0' });
});

// Placeholder routes
app.post('/api/auth/register', (req, res) => {
  res.status(501).json({ error: 'Not implemented - database connection needed' });
});

app.post('/api/auth/login', (req, res) => {
  res.status(501).json({ error: 'Not implemented - database connection needed' });
});

// Serve frontend build (single-service deployment)
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 RumahKas API (minimal mode) running on http://localhost:${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
  console.log(`📍 Status: http://localhost:${PORT}/api/status`);
  console.log(`⚠️  Database-dependent routes not available yet`);
});

module.exports = app;
