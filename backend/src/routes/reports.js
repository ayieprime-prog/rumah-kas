const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get monthly report
router.get('/monthly/:month', async (req, res) => {
  const { householdId } = req;
  const { month } = req.params; // Format: YYYY-MM

  try {
    const [year, monthNum] = month.split('-');
    const startDate = new Date(`${year}-${monthNum}-01`);
    const endDate = new Date(parseInt(year), parseInt(monthNum), 0);

    const [expenses, incomes, budgets] = await Promise.all([
      prisma.expense.findMany({
        where: {
          householdId,
          date: { gte: startDate, lte: endDate }
        },
        include: { category: true }
      }),
      prisma.income.findMany({
        where: {
          householdId,
          date: { gte: startDate, lte: endDate }
        }
      }),
      prisma.budget.findMany({
        where: { householdId, month },
        include: { category: true }
      })
    ]);

    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

    const categoryBreakdown = {};
    expenses.forEach(exp => {
      if (!categoryBreakdown[exp.categoryId]) {
        categoryBreakdown[exp.categoryId] = {
          name: exp.category.name,
          amount: 0,
          percentage: 0
        };
      }
      categoryBreakdown[exp.categoryId].amount += exp.amount;
    });

    Object.keys(categoryBreakdown).forEach(key => {
      categoryBreakdown[key].percentage = ((categoryBreakdown[key].amount / totalExpense) * 100).toFixed(2);
    });

    res.json({
      month,
      income: {
        total: totalIncome,
        sources: incomes
      },
      expense: {
        total: totalExpense,
        byCategory: categoryBreakdown
      },
      budget: budgets,
      balance: totalIncome - totalExpense,
      savingsRate: totalIncome > 0 ? (((totalIncome - totalExpense) / totalIncome) * 100).toFixed(2) : 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Get year-to-date summary
router.get('/yearly/:year', async (req, res) => {
  const { householdId } = req;
  const { year } = req.params;

  try {
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);

    const [expenses, incomes] = await Promise.all([
      prisma.expense.findMany({
        where: {
          householdId,
          date: { gte: startDate, lte: endDate }
        }
      }),
      prisma.income.findMany({
        where: {
          householdId,
          date: { gte: startDate, lte: endDate }
        }
      })
    ]);

    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

    res.json({
      year,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      monthlyBreakdown: generateMonthlyBreakdown(expenses, incomes)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate yearly report' });
  }
});

function generateMonthlyBreakdown(expenses, incomes) {
  const breakdown = {};
  for (let i = 1; i <= 12; i++) {
    const month = String(i).padStart(2, '0');
    breakdown[month] = { income: 0, expense: 0 };
  }

  expenses.forEach(exp => {
    const month = String(exp.date.getMonth() + 1).padStart(2, '0');
    breakdown[month].expense += exp.amount;
  });

  incomes.forEach(inc => {
    const month = String(inc.date.getMonth() + 1).padStart(2, '0');
    breakdown[month].income += inc.amount;
  });

  return breakdown;
}

module.exports = router;
