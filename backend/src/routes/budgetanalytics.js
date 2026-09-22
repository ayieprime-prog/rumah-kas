const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

const handlePrismaError = (err, res) => {
  console.error('Database error:', err.message);
  res.status(500).json({ error: 'Database error' });
};

// Helper to get year-month string
const getYearMonth = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// Helper to get previous months
const getPreviousMonths = (count = 6) => {
  const months = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(getYearMonth(d));
  }
  return months;
};

// GET /api/budget-analytics/overview - Get budget analytics overview
// Query params: ?month=2026-09 (defaults to current month)
router.get('/overview', async (req, res) => {
  try {
    const userId = req.userId;
    const { month } = req.query;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const targetMonth = month || getYearMonth(new Date());
    const [year, monthNum] = targetMonth.split('-');
    const startDate = new Date(`${year}-${monthNum}-01`);
    const endDate = new Date(year, parseInt(monthNum), 0);

    // Get all budgets for the month
    const budgets = await prisma.budget.findMany({
      where: {
        householdId: user.householdId,
        month: targetMonth
      },
      include: {
        category: true
      }
    });

    // Get actual expenses for the month
    const expenses = await prisma.expense.findMany({
      where: {
        householdId: user.householdId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        category: true
      }
    });

    // Calculate budget vs actual for each category
    const categoryAnalysis = budgets.map(budget => {
      const categoryExpenses = expenses.filter(e => e.categoryId === budget.categoryId);
      const actualSpent = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
      const variance = budget.limit - actualSpent;
      const percentageUsed = budget.limit > 0 ? Math.round((actualSpent / budget.limit) * 100) : 0;
      const status = percentageUsed > 100 ? 'over' : percentageUsed > 80 ? 'warning' : 'on-track';

      return {
        categoryId: budget.categoryId,
        categoryName: budget.category.name,
        categoryColor: budget.category.color,
        budgetLimit: budget.limit,
        actualSpent,
        variance,
        percentageUsed,
        status,
        count: categoryExpenses.length
      };
    });

    // Sort by percentage used descending
    categoryAnalysis.sort((a, b) => b.percentageUsed - a.percentageUsed);

    // Calculate totals
    const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalVariance = totalBudget - totalSpent;
    const overBudgetCategories = categoryAnalysis.filter(c => c.status === 'over').length;
    const efficiencyScore = totalBudget > 0 ? Math.max(0, Math.round(((totalBudget - totalSpent) / totalBudget) * 100)) : 0;

    res.json({
      month: targetMonth,
      summary: {
        totalBudget,
        totalSpent,
        totalVariance,
        percentageUsed: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
        efficiencyScore,
        overBudgetCategories,
        onTrackCategories: categoryAnalysis.filter(c => c.status === 'on-track').length,
        warningCategories: categoryAnalysis.filter(c => c.status === 'warning').length
      },
      categories: categoryAnalysis
    });
  } catch (err) {
    handlePrismaError(err, res);
  }
});

// GET /api/budget-analytics/trends - Get 6-month spending trends
// Query params: ?months=6 (number of months to analyze)
router.get('/trends', async (req, res) => {
  try {
    const userId = req.userId;
    const { months = 6 } = req.query;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const monthsList = getPreviousMonths(parseInt(months));

    // Get all expenses for the period
    const monthlyData = {};
    for (const m of monthsList) {
      const [year, monthNum] = m.split('-');
      const startDate = new Date(`${year}-${monthNum}-01`);
      const endDate = new Date(year, parseInt(monthNum), 0);

      const expenses = await prisma.expense.findMany({
        where: {
          householdId: user.householdId,
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const budgets = await prisma.budget.findMany({
        where: {
          householdId: user.householdId,
          month: m
        }
      });

      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);

      monthlyData[m] = {
        month: m,
        budget: totalBudget,
        actual: totalExpenses,
        variance: totalBudget - totalExpenses,
        percentageUsed: totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 100) : 0
      };
    }

    // Calculate trend (is spending going up or down)
    const trend = [];
    const values = Object.values(monthlyData);
    for (let i = 0; i < values.length; i++) {
      if (i === 0) {
        trend.push({ ...values[i], trend: null });
      } else {
        const previousActual = values[i - 1].actual;
        const currentActual = values[i].actual;
        const trendValue = ((currentActual - previousActual) / previousActual) * 100;
        trend.push({ ...values[i], trend: Math.round(trendValue) });
      }
    }

    res.json({
      months: monthsList,
      data: trend,
      summary: {
        averageBudget: Math.round(values.reduce((sum, v) => sum + v.budget, 0) / values.length),
        averageActual: Math.round(values.reduce((sum, v) => sum + v.actual, 0) / values.length),
        lowestMonth: values.reduce((min, v) => v.actual < min.actual ? v : min),
        highestMonth: values.reduce((max, v) => v.actual > max.actual ? v : max),
        totalVariance: values.reduce((sum, v) => sum + v.variance, 0)
      }
    });
  } catch (err) {
    handlePrismaError(err, res);
  }
});

// GET /api/budget-analytics/category-trends - Analyze trending categories
// Query params: ?months=6
router.get('/category-trends', async (req, res) => {
  try {
    const userId = req.userId;
    const { months = 6 } = req.query;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const monthsList = getPreviousMonths(parseInt(months));

    // Group expenses by category and month
    const categoryData = {};

    for (const m of monthsList) {
      const [year, monthNum] = m.split('-');
      const startDate = new Date(`${year}-${monthNum}-01`);
      const endDate = new Date(year, parseInt(monthNum), 0);

      const expenses = await prisma.expense.findMany({
        where: {
          householdId: user.householdId,
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        include: { category: true }
      });

      expenses.forEach(exp => {
        if (!categoryData[exp.categoryId]) {
          categoryData[exp.categoryId] = {
            categoryId: exp.categoryId,
            categoryName: exp.category.name,
            categoryColor: exp.category.color,
            monthlyData: {}
          };
        }
        if (!categoryData[exp.categoryId].monthlyData[m]) {
          categoryData[exp.categoryId].monthlyData[m] = 0;
        }
        categoryData[exp.categoryId].monthlyData[m] += exp.amount;
      });
    }

    // Calculate trend for each category
    const categories = Object.values(categoryData).map(cat => {
      const values = monthsList.map(m => cat.monthlyData[m] || 0);
      const firstValue = values[0];
      const lastValue = values[values.length - 1];
      const trend = firstValue > 0 ? Math.round(((lastValue - firstValue) / firstValue) * 100) : 0;
      const average = Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
      const highest = Math.max(...values);
      const lowest = Math.min(...values);

      return {
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        categoryColor: cat.categoryColor,
        trend,
        trendDirection: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable',
        average,
        highest,
        lowest,
        data: monthsList.map(m => ({
          month: m,
          amount: cat.monthlyData[m] || 0
        }))
      };
    });

    // Sort by trend (most trending up/down first)
    categories.sort((a, b) => Math.abs(b.trend) - Math.abs(a.trend));

    res.json({
      months: monthsList,
      categories
    });
  } catch (err) {
    handlePrismaError(err, res);
  }
});

// GET /api/budget-analytics/forecast - Forecast next month spending
router.get('/forecast', async (req, res) => {
  try {
    const userId = req.userId;
    const { months = 3 } = req.query; // Use last 3 months for forecast

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const monthsList = getPreviousMonths(parseInt(months));
    const now = new Date();
    const nextMonth = `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}`;

    // Get historical monthly totals
    const historicalData = [];
    for (const m of monthsList) {
      const [year, monthNum] = m.split('-');
      const startDate = new Date(`${year}-${monthNum}-01`);
      const endDate = new Date(year, parseInt(monthNum), 0);

      const expenses = await prisma.expense.findMany({
        where: {
          householdId: user.householdId,
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        include: { category: true }
      });

      const byCategory = {};
      expenses.forEach(exp => {
        if (!byCategory[exp.categoryId]) {
          byCategory[exp.categoryId] = {
            categoryId: exp.categoryId,
            categoryName: exp.category.name,
            categoryColor: exp.category.color,
            amount: 0
          };
        }
        byCategory[exp.categoryId].amount += exp.amount;
      });

      historicalData.push({
        month: m,
        total: expenses.reduce((sum, e) => sum + e.amount, 0),
        byCategory: Object.values(byCategory)
      });
    }

    // Calculate average for each category
    const categoryForecasts = {};
    historicalData.forEach(monthData => {
      monthData.byCategory.forEach(cat => {
        if (!categoryForecasts[cat.categoryId]) {
          categoryForecasts[cat.categoryId] = {
            categoryId: cat.categoryId,
            categoryName: cat.categoryName,
            categoryColor: cat.categoryColor,
            amounts: []
          };
        }
        categoryForecasts[cat.categoryId].amounts.push(cat.amount);
      });
    });

    // Calculate forecast for next month
    const forecast = Object.values(categoryForecasts).map(cat => {
      const average = cat.amounts.reduce((sum, a) => sum + a, 0) / cat.amounts.length;
      const variance = cat.amounts.length > 1
        ? Math.sqrt(cat.amounts.reduce((sum, a) => sum + Math.pow(a - average, 2), 0) / cat.amounts.length)
        : 0;
      const confidence = 95 - (variance / average * 100); // Simple confidence calculation

      return {
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        categoryColor: cat.categoryColor,
        forecasted: Math.round(average),
        confidence: Math.max(30, Math.round(confidence)),
        range: {
          low: Math.round(average - variance),
          high: Math.round(average + variance)
        }
      };
    });

    const totalForecast = forecast.reduce((sum, f) => sum + f.forecasted, 0);

    // Get next month's budget if it exists
    const nextMonthBudgets = await prisma.budget.findMany({
      where: {
        householdId: user.householdId,
        month: nextMonth
      }
    });

    const nextMonthBudgetTotal = nextMonthBudgets.reduce((sum, b) => sum + b.limit, 0);

    res.json({
      currentMonth: getYearMonth(now),
      nextMonth,
      forecast,
      summary: {
        forecastedTotal: totalForecast,
        budgetedTotal: nextMonthBudgetTotal,
        difference: nextMonthBudgetTotal - totalForecast,
        historicalMonths: historicalData.length,
        averageMonthlySpending: Math.round(historicalData.reduce((sum, m) => sum + m.total, 0) / historicalData.length)
      }
    });
  } catch (err) {
    handlePrismaError(err, res);
  }
});

module.exports = router;
