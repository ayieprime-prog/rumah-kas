const express = require('express');

const router = express.Router();

// In-memory ring buffer of recent slow-metric alerts, per household. This
// app runs as a single instance (see caching.js's own note on the same
// assumption), so there's no need for a shared store - it resets on
// restart/deploy, which is fine for a "what's been slow recently" view.
const MAX_ALERTS_PER_HOUSEHOLD = 100;
const alertsByHousehold = new Map();

// Record a slow metric reported by the frontend (see
// frontend/src/utils/performanceMonitoring.js's logPerformanceAlert)
router.post('/alerts', (req, res) => {
  const { householdId } = req;
  const { metric, value, unit, url } = req.body;

  if (!metric || typeof value !== 'number') {
    return res.status(400).json({ error: 'metric and numeric value are required' });
  }

  if (!alertsByHousehold.has(householdId)) {
    alertsByHousehold.set(householdId, []);
  }
  const alerts = alertsByHousehold.get(householdId);

  alerts.unshift({
    metric,
    value,
    unit: unit || 'ms',
    url: url || null,
    createdAt: new Date().toISOString()
  });
  if (alerts.length > MAX_ALERTS_PER_HOUSEHOLD) {
    alerts.length = MAX_ALERTS_PER_HOUSEHOLD;
  }

  res.status(201).json({ message: 'Alert recorded' });
});

// Recent alerts + a quick summary, for the household admin's Settings page.
router.get('/alerts', (req, res) => {
  const { householdId } = req;
  const alerts = alertsByHousehold.get(householdId) || [];

  const byMetric = {};
  for (const alert of alerts) {
    if (!byMetric[alert.metric]) byMetric[alert.metric] = { count: 0, total: 0 };
    byMetric[alert.metric].count += 1;
    byMetric[alert.metric].total += alert.value;
  }
  const summary = Object.entries(byMetric).map(([metric, { count, total }]) => ({
    metric,
    count,
    averageValue: Math.round((total / count) * 100) / 100
  }));

  res.json({ count: alerts.length, alerts: alerts.slice(0, 20), summary });
});

module.exports = router;
