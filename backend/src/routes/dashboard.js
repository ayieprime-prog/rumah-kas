const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { checkDebtPaymentDue } = require('../utils/notificationTriggers');
const { getAllLockedAllocations } = require('../utils/incomeLock');

const router = express.Router();
const prisma = new PrismaClient();

// Get dashboard overview for current month
router.get('/', async (req, res) => {
  const { householdId } = req;
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  try {
    // Time-based check (no user action triggers it) -- piggyback on dashboard
    // loads instead of adding a cron dependency. Best-effort: never let a
    // notification hiccup break the dashboard itself.
    checkDebtPaymentDue(prisma, householdId).catch((err) => {
      console.error('checkDebtPaymentDue error:', err);
    });

    const [expenses, incomes, budgets, goals, debts, wallets, incomeLocks] = await Promise.all([
      prisma.expense.findMany({
        where: {
          householdId,
          date: {
            gte: new Date(`${currentMonth}-01`),
            lte: new Date(now.getFullYear(), now.getMonth() + 1, 0)
          }
        },
        include: { category: true }
      }),
      prisma.income.findMany({
        where: {
          householdId,
          date: {
            gte: new Date(`${currentMonth}-01`),
            lte: new Date(now.getFullYear(), now.getMonth() + 1, 0)
          }
        }
      }),
      prisma.budget.findMany({
        where: { householdId, month: currentMonth },
        include: { category: true }
      }),
      prisma.goal.findMany({
        where: { householdId }
      }),
      prisma.debt.findMany({
        where: { householdId }
      }),
      prisma.wallet.findMany({
        where: { householdId, isActive: true },
        orderBy: { createdAt: 'asc' }
      }),
      getAllLockedAllocations(prisma, householdId, currentMonth)
    ]);

    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
    const balance = totalIncome - totalExpense;

    // Group expenses by category
    const expensesByCategory = {};
    expenses.forEach(exp => {
      const catName = exp.category.name;
      if (!expensesByCategory[catName]) {
        expensesByCategory[catName] = 0;
      }
      expensesByCategory[catName] += exp.amount;
    });

    // Calculate debt summary
    const totalDebt = debts.reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0);

    // Calculate wallet summary
    const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

    res.json({
      overview: {
        currentMonth,
        totalIncome,
        totalExpense,
        balance
      },
      expensesByCategory,
      budgets,
      goals: goals.map(g => ({
        ...g,
        progress: (g.currentAmount / g.targetAmount) * 100
      })),
      debtSummary: {
        totalDebt,
        debtCount: debts.length
      },
      wallets: wallets.map(w => ({
        id: w.id,
        name: w.name,
        type: w.type,
        balance: w.balance,
        icon: w.icon
      })),
      walletSummary: {
        totalBalance,
        walletCount: wallets.length
      },
      incomeLocks
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;
