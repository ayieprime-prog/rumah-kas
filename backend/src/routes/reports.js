const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { getMonthRange } = require('../utils/dateRange');

const router = express.Router();
const prisma = new PrismaClient();

// All arithmetic here is done in UTC, matching how dates are stored
// (always UTC midnight - see monthOf()-style helpers elsewhere) rather
// than the server's local timezone. Parsing with a trailing 'Z' but then
// using local-time getDay()/setDate()/setHours() would silently shift
// which calendar day/week a transaction falls into on any server not
// running in UTC.
function getWeekRange(dateStr) {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  const day = d.getUTCDay(); // 0 (Sun) - 6 (Sat)
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + diffToMonday);
  monday.setUTCHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);
  return { startDate: monday, endDate: sunday };
}

async function computeReport(householdId, startDate, endDate) {
  const [expenses, incomes] = await Promise.all([
    prisma.expense.findMany({
      where: { householdId, date: { gte: startDate, lte: endDate } },
      include: { category: true }
    }),
    prisma.income.findMany({
      where: { householdId, date: { gte: startDate, lte: endDate } }
    })
  ]);

  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryBreakdown = {};
  expenses.forEach(exp => {
    if (!categoryBreakdown[exp.categoryId]) {
      categoryBreakdown[exp.categoryId] = { name: exp.category.name, amount: 0, percentage: 0 };
    }
    categoryBreakdown[exp.categoryId].amount += exp.amount;
  });
  Object.keys(categoryBreakdown).forEach(key => {
    categoryBreakdown[key].percentage = totalExpense > 0
      ? ((categoryBreakdown[key].amount / totalExpense) * 100).toFixed(2)
      : '0.00';
  });

  return {
    income: { total: totalIncome, sources: incomes },
    expense: { total: totalExpense, byCategory: categoryBreakdown },
    balance: totalIncome - totalExpense,
    savingsRate: totalIncome > 0 ? (((totalIncome - totalExpense) / totalIncome) * 100).toFixed(2) : '0.00'
  };
}

// Get daily report (date format: YYYY-MM-DD)
router.get('/daily/:date', async (req, res) => {
  const { householdId } = req;
  const { date } = req.params;

  try {
    const startDate = new Date(`${date}T00:00:00.000Z`);
    const endDate = new Date(`${date}T23:59:59.999Z`);
    const data = await computeReport(householdId, startDate, endDate);
    res.json({ period: 'daily', date, ...data, budget: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate daily report' });
  }
});

// Get weekly report (date = any day within the target week; week runs Mon-Sun)
router.get('/weekly/:date', async (req, res) => {
  const { householdId } = req;
  const { date } = req.params;

  try {
    const { startDate, endDate } = getWeekRange(date);
    const data = await computeReport(householdId, startDate, endDate);
    res.json({
      period: 'weekly',
      date,
      weekStart: startDate.toISOString().slice(0, 10),
      weekEnd: endDate.toISOString().slice(0, 10),
      ...data,
      budget: []
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate weekly report' });
  }
});

// Get monthly report (month format: YYYY-MM)
router.get('/monthly/:month', async (req, res) => {
  const { householdId } = req;
  const { month } = req.params;

  try {
    const { gte: startDate, lt: monthEnd } = getMonthRange(month);
    const endDate = new Date(monthEnd.getTime() - 1);

    const [data, budgets] = await Promise.all([
      computeReport(householdId, startDate, endDate),
      prisma.budget.findMany({ where: { householdId, month }, include: { category: true } })
    ]);

    res.json({ period: 'monthly', month, ...data, budget: budgets });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Get yearly report (year format: YYYY)
router.get('/yearly/:year', async (req, res) => {
  const { householdId } = req;
  const { year } = req.params;

  try {
    const startDate = new Date(`${year}-01-01T00:00:00`);
    const endDate = new Date(`${year}-12-31T23:59:59.999`);
    const data = await computeReport(householdId, startDate, endDate);
    res.json({ period: 'yearly', year, ...data, budget: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate yearly report' });
  }
});

module.exports = router;
