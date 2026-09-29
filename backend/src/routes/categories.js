const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { invalidateCache } = require('../utils/caching');

const router = express.Router();
const prisma = new PrismaClient();

// Get all expense categories for household
router.get('/', async (req, res) => {
  const { householdId } = req;

  try {
    const categories = await prisma.expenseCategory.findMany({
      where: { householdId },
      orderBy: { createdAt: 'asc' }
    });

    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create category
router.post('/', async (req, res) => {
  const { name, icon, color } = req.body;
  const { householdId } = req;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const existing = await prisma.expenseCategory.findFirst({ where: { householdId, name } });
    if (existing) {
      return res.status(409).json({ error: 'Category with this name already exists' });
    }

    const category = await prisma.expenseCategory.create({
      data: {
        name,
        icon: icon || 'folder',
        color: color || '#B0E0E6',
        householdId
      }
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, icon, color } = req.body;
  const { householdId } = req;

  try {
    const existing = await prisma.expenseCategory.findFirst({ where: { id, householdId } });
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (name && name !== existing.name) {
      const duplicate = await prisma.expenseCategory.findFirst({ where: { householdId, name } });
      if (duplicate) {
        return res.status(409).json({ error: 'Category with this name already exists' });
      }
    }

    const category = await prisma.expenseCategory.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(icon && { icon }),
        ...(color && { color })
      }
    });

    invalidateCache.dashboard(householdId);
    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category (blocked while anything still references it)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { householdId } = req;

  try {
    const existing = await prisma.expenseCategory.findFirst({ where: { id, householdId } });
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const [expenseCount, budgetCount, recurringCount] = await Promise.all([
      prisma.expense.count({ where: { categoryId: id } }),
      prisma.budget.count({ where: { categoryId: id } }),
      prisma.recurringExpense.count({ where: { categoryId: id } })
    ]);

    if (expenseCount > 0 || budgetCount > 0 || recurringCount > 0) {
      return res.status(409).json({
        error: 'Category is still in use and cannot be deleted',
        usage: { expenses: expenseCount, budgets: budgetCount, recurring: recurringCount }
      });
    }

    await prisma.expenseCategory.delete({ where: { id } });

    invalidateCache.dashboard(householdId);
    res.json({ message: 'Category deleted' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;
