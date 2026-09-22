const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

const handlePrismaError = (err, res) => {
  console.error('Database error:', err.message);
  res.status(500).json({ error: 'Database error' });
};

// Helper function to get year-month string
const getYearMonth = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// GET /api/allocation - Get income allocation for a specific month
// Query params: ?month=2026-09 (defaults to current month)
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;
    const { month } = req.query;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Use provided month or default to current month
    const targetMonth = month || getYearMonth(new Date());
    const [year, monthNum] = targetMonth.split('-');
    const startDate = new Date(`${year}-${monthNum}-01`);
    const endDate = new Date(year, parseInt(monthNum), 0); // Last day of month

    // Get all incomes for the month
    const incomes = await prisma.income.findMany({
      where: {
        householdId: user.householdId,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);

    if (totalIncome === 0) {
      return res.json({
        month: targetMonth,
        totalIncome: 0,
        allocation: [
          { category: 'Pengeluaran', amount: 0, percentage: 0 },
          { category: 'Tabungan Goals', amount: 0, percentage: 0 },
          { category: 'Reserve/Emergency', amount: 0, percentage: 0 }
        ],
        breakdown: []
      });
    }

    // Get all expenses for the month
    const expenses = await prisma.expense.findMany({
      where: {
        householdId: user.householdId,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Get all goal savings for the month (estimate based on current amounts)
    const goals = await prisma.goal.findMany({
      where: { householdId: user.householdId }
    });

    // Get wallet balances to estimate savings
    const wallets = await prisma.wallet.findMany({
      where: { householdId: user.householdId }
    });

    const totalWalletBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

    // Calculate allocation
    const expensesAllocation = Math.min(totalExpenses, totalIncome);
    const goalsSavingsEstimate = goals.reduce((sum, g) => sum + g.currentAmount, 0);

    // Reserve is the remaining income after expenses and estimated goal savings
    const reserveAllocation = Math.max(0, totalIncome - expensesAllocation - (totalIncome * 0.1)); // 10% default for reserve

    // Get expense breakdown by category
    const expensesByCategory = await prisma.expense.groupBy({
      by: ['categoryId'],
      where: {
        householdId: user.householdId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        amount: true
      }
    });

    const categoryBreakdown = await Promise.all(
      expensesByCategory.map(async (exp) => {
        const category = await prisma.expenseCategory.findUnique({
          where: { id: exp.categoryId }
        });
        return {
          id: exp.categoryId,
          name: category?.name || 'Unknown',
          amount: exp._sum.amount || 0,
          percentage: totalExpenses > 0 ? Math.round((exp._sum.amount / totalExpenses) * 100) : 0,
          color: category?.color || '#999'
        };
      })
    );

    // Sort by amount descending
    categoryBreakdown.sort((a, b) => b.amount - a.amount);

    res.json({
      month: targetMonth,
      totalIncome,
      allocation: [
        {
          category: 'Pengeluaran',
          amount: expensesAllocation,
          percentage: Math.round((expensesAllocation / totalIncome) * 100)
        },
        {
          category: 'Tabungan Goals',
          amount: goalsSavingsEstimate,
          percentage: totalIncome > 0 ? Math.round((goalsSavingsEstimate / totalIncome) * 100) : 0
        },
        {
          category: 'Reserve/Emergency',
          amount: reserveAllocation,
          percentage: Math.round((reserveAllocation / totalIncome) * 100)
        }
      ],
      breakdown: categoryBreakdown,
      summary: {
        totalIncome,
        totalExpenses,
        totalGoalsSavings: goalsSavingsEstimate,
        walletBalance: totalWalletBalance,
        remainingIncome: totalIncome - expensesAllocation
      }
    });
  } catch (err) {
    handlePrismaError(err, res);
  }
});

// GET /api/allocation/history - Get allocation history for a year
// Query params: ?year=2026 (defaults to current year)
router.get('/history', async (req, res) => {
  try {
    const userId = req.userId;
    const { year } = req.query;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const targetYear = year || new Date().getFullYear();

    // Get all incomes for the year
    const startDate = new Date(`${targetYear}-01-01`);
    const endDate = new Date(`${targetYear}-12-31`);

    const allIncomes = await prisma.income.findMany({
      where: {
        householdId: user.householdId,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const allExpenses = await prisma.expense.findMany({
      where: {
        householdId: user.householdId,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Group by month
    const monthlyData = {};
    for (let m = 1; m <= 12; m++) {
      const monthStr = String(m).padStart(2, '0');
      monthlyData[monthStr] = {
        income: 0,
        expenses: 0,
        month: `${targetYear}-${monthStr}`
      };
    }

    allIncomes.forEach(inc => {
      const monthStr = String(new Date(inc.date).getMonth() + 1).padStart(2, '0');
      monthlyData[monthStr].income += inc.amount;
    });

    allExpenses.forEach(exp => {
      const monthStr = String(new Date(exp.date).getMonth() + 1).padStart(2, '0');
      monthlyData[monthStr].expenses += exp.amount;
    });

    const history = Object.values(monthlyData).map(data => ({
      month: data.month,
      totalIncome: data.income,
      totalExpenses: data.expenses,
      savings: Math.max(0, data.income - data.expenses),
      savingsPercentage: data.income > 0 ? Math.round(((data.income - data.expenses) / data.income) * 100) : 0
    }));

    res.json({
      year: targetYear,
      history,
      yearSummary: {
        totalIncome: history.reduce((sum, m) => sum + m.totalIncome, 0),
        totalExpenses: history.reduce((sum, m) => sum + m.totalExpenses, 0),
        totalSavings: history.reduce((sum, m) => sum + m.savings, 0),
        averageMonthlyIncome: Math.round(history.reduce((sum, m) => sum + m.totalIncome, 0) / 12),
        averageMonthlyExpenses: Math.round(history.reduce((sum, m) => sum + m.totalExpenses, 0) / 12)
      }
    });
  } catch (err) {
    handlePrismaError(err, res);
  }
});

module.exports = router;
