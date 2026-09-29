const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { logAudit } = require('../utils/audit');
const { checkLockExceeded } = require('../utils/incomeLock');
const { invalidateCache } = require('../utils/caching');
const { getMonthRange } = require('../utils/dateRange');
const { validateString, validateAmount, validateDate, validateEnum, validatePagination } = require('../utils/validation');

const router = express.Router();
const prisma = new PrismaClient();

const monthOf = (date) => new Date(date).toISOString().slice(0, 7);
const SCOPES = ['KELUARGA', 'PRIBADI'];

async function adjustWalletBalance(tx, walletId, delta) {
  if (!walletId || !delta) return;
  await tx.wallet.update({ where: { id: walletId }, data: { balance: { increment: delta } } });
}

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
        message: `Anggaran "${category?.name}" sudah melebihi batas bulan ini`,
        householdId
      }
    });
  }
}

// Create expense
router.post('/', async (req, res) => {
  const { description, amount, categoryId, date, walletId, scope } = req.body;
  const { householdId, userId } = req;

  try {
    // Validate all inputs before processing
    const validDescription = validateString(description, 'description', { minLength: 1, maxLength: 200 });
    const validAmount = validateAmount(amount, 'amount');
    const validCategoryId = validateString(categoryId, 'categoryId', { maxLength: 50 });
    const validDate = validateDate(date, 'date');
    const validScope = scope ? validateEnum(scope, 'scope', SCOPES, { required: false }) : 'KELUARGA';
    const validWalletId = walletId ? validateString(walletId, 'walletId', { maxLength: 50, required: false }) : null;

    const category = await prisma.expenseCategory.findFirst({ where: { id: validCategoryId, householdId } });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (validWalletId) {
      const wallet = await prisma.wallet.findFirst({ where: { id: validWalletId, householdId } });
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }
    }

    const expense = await prisma.$transaction(async (tx) => {
      const created = await tx.expense.create({
        data: { description: validDescription, amount: validAmount, date: validDate, householdId, categoryId: validCategoryId, walletId: validWalletId, scope: validScope },
        include: { category: true, wallet: true }
      });
      await adjustBudgetSpent(tx, householdId, monthOf(validDate), validCategoryId, validAmount);
      await adjustWalletBalance(tx, validWalletId, -validAmount);
      await logAudit(tx, {
        userId, householdId, action: 'CREATE_EXPENSE', entity: 'EXPENSE', entityId: created.id,
        summary: `${validDescription} - Rp${validAmount.toLocaleString('id-ID')}`
      });
      await tx.notification.create({
        data: {
          type: 'EXPENSE_RECORDED',
          message: `Pengeluaran baru dicatat: ${validDescription} - Rp${validAmount.toLocaleString('id-ID')}`,
          householdId
        }
      });
      await checkLockExceeded(tx, householdId, validCategoryId, monthOf(validDate));
      return created;
    });

    invalidateCache.dashboard(householdId);
    res.status(201).json(expense);
  } catch (error) {
    console.error('Create expense error:', error);
    const statusCode = error.message.includes('must') || error.message.includes('required') ? 400 : 500;
    const message = statusCode === 400 ? error.message : 'Failed to create expense';
    res.status(statusCode).json({ error: message });
  }
});

// Get expenses with filters
router.get('/', async (req, res) => {
  const { householdId } = req;
  const { month, categoryId } = req.query;

  try {
    // Validate pagination parameters
    const { limit, offset } = validatePagination(req.query);

    const where = { householdId };

    // Validate month if provided
    if (month) {
      const validMonth = validateString(month, 'month', { maxLength: 7, required: false });
      if (validMonth && /^\d{4}-\d{2}$/.test(validMonth)) {
        where.date = getMonthRange(validMonth);
      }
    }

    // Validate category if provided
    if (categoryId) {
      where.categoryId = validateString(categoryId, 'categoryId', { maxLength: 50, required: false });
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: { category: true, wallet: true },
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
  const { description, amount, categoryId, date, walletId, scope } = req.body;
  const { householdId, userId } = req;

  if (scope && !SCOPES.includes(scope)) {
    return res.status(400).json({ error: `Scope must be one of: ${SCOPES.join(', ')}` });
  }

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

    if (walletId && walletId !== existing.walletId) {
      const wallet = await prisma.wallet.findFirst({ where: { id: walletId, householdId } });
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }
    }

    const newAmount = amount !== undefined ? parseFloat(amount) : existing.amount;
    const newCategoryId = categoryId || existing.categoryId;
    const newDate = date ? new Date(date) : existing.date;
    const newWalletId = walletId !== undefined ? walletId : existing.walletId;

    const expense = await prisma.$transaction(async (tx) => {
      const updated = await tx.expense.update({
        where: { id },
        data: {
          ...(description && { description }),
          ...(amount !== undefined && { amount: newAmount }),
          ...(categoryId && { categoryId }),
          ...(date && { date: newDate }),
          ...(walletId !== undefined && { walletId: newWalletId }),
          ...(scope && { scope })
        },
        include: { category: true, wallet: true }
      });

      // Reverse the old amount from the old month/category budget, apply the new one
      await adjustBudgetSpent(tx, householdId, monthOf(existing.date), existing.categoryId, -existing.amount);
      await adjustBudgetSpent(tx, householdId, monthOf(newDate), newCategoryId, newAmount);
      // Reverse the old wallet impact, apply the new one (handles wallet or amount changes)
      await adjustWalletBalance(tx, existing.walletId, existing.amount);
      await adjustWalletBalance(tx, newWalletId, -newAmount);
      await logAudit(tx, {
        userId, householdId, action: 'UPDATE_EXPENSE', entity: 'EXPENSE', entityId: id,
        summary: `${updated.description} - Rp${newAmount.toLocaleString('id-ID')}`
      });

      await checkLockExceeded(tx, householdId, newCategoryId, monthOf(newDate));
      if (newCategoryId !== existing.categoryId || monthOf(newDate) !== monthOf(existing.date)) {
        await checkLockExceeded(tx, householdId, existing.categoryId, monthOf(existing.date));
      }

      return updated;
    });

    invalidateCache.dashboard(householdId);
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
      await adjustWalletBalance(tx, existing.walletId, existing.amount);
      await logAudit(tx, {
        userId, householdId, action: 'DELETE_EXPENSE', entity: 'EXPENSE', entityId: id,
        summary: `${existing.description} - Rp${existing.amount.toLocaleString('id-ID')}`
      });
    });

    invalidateCache.dashboard(householdId);
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

module.exports = router;
