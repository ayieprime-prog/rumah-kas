const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { logAudit } = require('../utils/audit');

const router = express.Router();
const prisma = new PrismaClient();

const monthOf = (date) => new Date(date).toISOString().slice(0, 7);

async function adjustBudgetSpent(tx, householdId, month, categoryId, delta) {
  if (!delta) return;
  const budget = await tx.budget.findUnique({
    where: { householdId_month_categoryId: { householdId, month, categoryId } }
  });
  if (!budget) return;
  const nextSpent = Math.max(0, budget.spent + delta);
  await tx.budget.update({ where: { id: budget.id }, data: { spent: nextSpent } });

  if (delta > 0 && nextSpent > budget.limit && budget.spent <= budget.limit) {
    const category = await tx.expenseCategory.findUnique({ where: { id: categoryId } });
    await tx.notification.create({
      data: {
        type: 'BUDGET_EXCEEDED',
        message: `Budget "${category?.name}" exceeded this month`,
        householdId
      }
    });
  }
}

// Create expense
router.post('/', async (req, res) => {
  const { description, amount, categoryId, date } = req.body;
  const { householdId, userId } = req;

  if (!description || !amount || !categoryId || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const category = await prisma.expenseCategory.findFirst({ where: { id: categoryId, householdId } });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const parsedAmount = parseFloat(amount);
    const expense = await prisma.$transaction(async (tx) => {
      const created = await tx.expense.create({
        data: { description, amount: parsedAmount, date: new Date(date), householdId, categoryId },
        include: { category: true }
      });
      await adjustBudgetSpent(tx, householdId, monthOf(date), categoryId, parsedAmount);
      await logAudit(tx, {
        userId, householdId, action: 'CREATE_EXPENSE', entity: 'EXPENSE', entityId: created.id,
        summary: `${description} - Rp${parsedAmount.toLocaleString('id-ID')}`
      });
      return created;
    });

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
  const { householdId, userId } = req;

  try {
    const existing = await prisma.expense.findFirst({ where: { id, householdId } });
    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (categoryId && categoryId !== existing.categoryId) {
      const category = await prisma.expenseCategory.findFirst({ where: { id: categoryId, householdId } });
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
    }

    const newAmount = amount !== undefined ? parseFloat(amount) : existing.amount;
    const newCategoryId = categoryId || existing.categoryId;
    const newDate = date ? new Date(date) : existing.date;

    const expense = await prisma.$transaction(async (tx) => {
      const updated = await tx.expense.update({
        where: { id },
        data: { description, amount: newAmount, categoryId, date: date ? newDate : undefined },
        include: { category: true }
      });

      // Reverse the old amount from the old month/category budget, apply the new one
      await adjustBudgetSpent(tx, householdId, monthOf(existing.date), existing.categoryId, -existing.amount);
      await adjustBudgetSpent(tx, householdId, monthOf(newDate), newCategoryId, newAmount);
      await logAudit(tx, {
        userId, householdId, action: 'UPDATE_EXPENSE', entity: 'EXPENSE', entityId: id,
        summary: `${updated.description} - Rp${newAmount.toLocaleString('id-ID')}`
      });

      return updated;
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
  const { householdId, userId } = req;

  try {
    const existing = await prisma.expense.findFirst({ where: { id, householdId } });
    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.expense.delete({ where: { id } });
      await adjustBudgetSpent(tx, householdId, monthOf(existing.date), existing.categoryId, -existing.amount);
      await logAudit(tx, {
        userId, householdId, action: 'DELETE_EXPENSE', entity: 'EXPENSE', entityId: id,
        summary: `${existing.description} - Rp${existing.amount.toLocaleString('id-ID')}`
      });
    });

    res.json({ message: 'Expense deleted' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

module.exports = router;
