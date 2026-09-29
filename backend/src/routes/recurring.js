const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { invalidateCache } = require('../utils/caching');

const router = express.Router();
const prisma = new PrismaClient();

const FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];

// Get all recurring expense rules for household
router.get('/', async (req, res) => {
  const { householdId } = req;

  try {
    const recurring = await prisma.recurringExpense.findMany({
      where: { householdId },
      include: { category: true, wallet: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(recurring);
  } catch (error) {
    console.error('Get recurring expenses error:', error);
    res.status(500).json({ error: 'Failed to fetch recurring expenses' });
  }
});

// Create recurring expense rule
router.post('/', async (req, res) => {
  const { description, amount, categoryId, walletId, frequency, startDate, endDate, isActive } = req.body;
  const { householdId } = req;

  if (!description || !amount || !categoryId || !frequency || !startDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!FREQUENCIES.includes(frequency)) {
    return res.status(400).json({ error: `Frequency must be one of: ${FREQUENCIES.join(', ')}` });
  }

  try {
    const category = await prisma.expenseCategory.findFirst({ where: { id: categoryId, householdId } });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (walletId) {
      const wallet = await prisma.wallet.findFirst({ where: { id: walletId, householdId } });
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }
    }

    const recurring = await prisma.recurringExpense.create({
      data: {
        description,
        amount: parseFloat(amount),
        categoryId,
        walletId: walletId || null,
        frequency,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive !== undefined ? isActive : true,
        householdId
      },
      include: { category: true, wallet: true }
    });

    res.status(201).json(recurring);
  } catch (error) {
    console.error('Create recurring expense error:', error);
    res.status(500).json({ error: 'Failed to create recurring expense' });
  }
});

// Update recurring expense rule
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { description, amount, categoryId, walletId, frequency, startDate, endDate, isActive } = req.body;
  const { householdId } = req;

  try {
    const existing = await prisma.recurringExpense.findFirst({ where: { id, householdId } });
    if (!existing) {
      return res.status(404).json({ error: 'Recurring expense not found' });
    }

    if (frequency && !FREQUENCIES.includes(frequency)) {
      return res.status(400).json({ error: `Frequency must be one of: ${FREQUENCIES.join(', ')}` });
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

    const recurring = await prisma.recurringExpense.update({
      where: { id },
      data: {
        ...(description && { description }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(categoryId && { categoryId }),
        ...(walletId !== undefined && { walletId: walletId || null }),
        ...(frequency && { frequency }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(isActive !== undefined && { isActive })
      },
      include: { category: true, wallet: true }
    });

    res.json(recurring);
  } catch (error) {
    console.error('Update recurring expense error:', error);
    res.status(500).json({ error: 'Failed to update recurring expense' });
  }
});

// Delete recurring expense rule (does not touch previously generated expenses)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { householdId } = req;

  try {
    const existing = await prisma.recurringExpense.findFirst({ where: { id, householdId } });
    if (!existing) {
      return res.status(404).json({ error: 'Recurring expense not found' });
    }

    await prisma.recurringExpense.delete({ where: { id } });

    invalidateCache.dashboard(householdId);
    res.json({ message: 'Recurring expense deleted' });
  } catch (error) {
    console.error('Delete recurring expense error:', error);
    res.status(500).json({ error: 'Failed to delete recurring expense' });
  }
});

module.exports = router;
