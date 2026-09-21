const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Create expense
router.post('/', async (req, res) => {
  const { description, amount, categoryId, date } = req.body;
  const { householdId } = req;

  if (!description || !amount || !categoryId || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const expense = await prisma.expense.create({
      data: {
        description,
        amount: parseFloat(amount),
        date: new Date(date),
        householdId,
        categoryId
      },
      include: { category: true }
    });

    // Update budget spent amount
    const monthStr = new Date(date).toISOString().slice(0, 7);
    const budget = await prisma.budget.findUnique({
      where: {
        householdId_month_categoryId: {
          householdId,
          month: monthStr,
          categoryId
        }
      }
    });

    if (budget) {
      await prisma.budget.update({
        where: { id: budget.id },
        data: { spent: budget.spent + parseFloat(amount) }
      });

      // Check if budget exceeded
      if (budget.spent + parseFloat(amount) > budget.limit) {
        await prisma.notification.create({
          data: {
            type: 'BUDGET_EXCEEDED',
            message: `Budget "${budget.category?.name}" exceeded this month`,
            householdId
          }
        });
      }
    }

    res.status(201).json(expense);
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Get expenses with filters
router.get('/', async (req, res) => {
  const { householdId } = req;
  const { month, categoryId, limit = 50, offset = 0 } = req.query;

  try {
    const where = { householdId };

    if (month) {
      const [year, monthNum] = month.split('-');
      const startDate = new Date(`${year}-${monthNum}-01`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      where.date = { gte: startDate, lte: endDate };
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: { category: true },
        orderBy: { date: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.expense.count({ where })
    ]);

    res.json({ expenses, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Update expense
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { description, amount, categoryId, date } = req.body;
  const { householdId } = req;

  try {
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        description,
        amount: amount ? parseFloat(amount) : undefined,
        categoryId,
        date: date ? new Date(date) : undefined
      },
      include: { category: true }
    });

    res.json(expense);
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// Delete expense
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.expense.delete({ where: { id } });
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

module.exports = router;
