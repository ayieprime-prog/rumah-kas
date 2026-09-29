const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { invalidateCache } = require('../utils/caching');
const { validateAmount, validateMonth, validateString } = require('../utils/validation');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  const { month, limit, categoryId } = req.body;
  const { householdId } = req;

  try {
    // Validate inputs
    const validMonth = validateMonth(month, 'month');
    const validLimit = validateAmount(limit, 'limit', { min: 0, max: 999999999.99 });
    const validCategoryId = validateString(categoryId, 'categoryId', { maxLength: 50 });

    const category = await prisma.expenseCategory.findFirst({ where: { id: validCategoryId, householdId } });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const budget = await prisma.budget.create({
      data: {
        month: validMonth,
        limit: validLimit,
        householdId,
        categoryId: validCategoryId
      },
      include: { category: true }
    });
    invalidateCache.dashboard(householdId);
    res.status(201).json(budget);
  } catch (error) {
    const statusCode = error.message.includes('must') || error.message.includes('valid') ? 400 : 500;
    const message = statusCode === 400 ? error.message : 'Failed to create budget';
    res.status(statusCode).json({ error: message });
  }
});

router.get('/', async (req, res) => {
  const { householdId } = req;
  const { month } = req.query;

  try {
    const where = { householdId };
    if (month) {
      const validMonth = validateMonth(month, 'month', { required: false });
      if (validMonth) where.month = validMonth;
    }

    const budgets = await prisma.budget.findMany({
      where,
      include: { category: true },
      orderBy: { month: 'desc' }
    });

    res.json(budgets);
  } catch (error) {
    const statusCode = error.message.includes('must') || error.message.includes('valid') ? 400 : 500;
    const message = statusCode === 400 ? error.message : 'Failed to fetch budgets';
    res.status(statusCode).json({ error: message });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { limit } = req.body;
  const { householdId } = req;

  try {
    // Validate inputs
    const validId = validateString(id, 'id', { maxLength: 50 });
    const validLimit = validateAmount(limit, 'limit', { min: 0, max: 999999999.99 });

    const existing = await prisma.budget.findFirst({ where: { id: validId, householdId } });
    if (!existing) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    const budget = await prisma.budget.update({
      where: { id: validId },
      data: { limit: validLimit },
      include: { category: true }
    });
    invalidateCache.dashboard(householdId);
    res.json(budget);
  } catch (error) {
    const statusCode = error.message.includes('must') || error.message.includes('valid') ? 400 : 500;
    const message = statusCode === 400 ? error.message : 'Failed to update budget';
    res.status(statusCode).json({ error: message });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { householdId } = req;

  try {
    // Validate id
    const validId = validateString(id, 'id', { maxLength: 50 });

    const existing = await prisma.budget.findFirst({ where: { id: validId, householdId } });
    if (!existing) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    await prisma.budget.delete({ where: { id: validId } });
    invalidateCache.dashboard(householdId);
    res.json({ message: 'Budget deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});

module.exports = router;
