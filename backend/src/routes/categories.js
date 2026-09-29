const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { invalidateCache } = require('../utils/caching');
const { validateString, validateHexColor, validateIconName } = require('../utils/validation');

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

  try {
    // Validate inputs
    const validName = validateString(name, 'name', { minLength: 1, maxLength: 100 });
    const validIcon = validateIconName(icon, 'icon', { required: false });
    const validColor = color ? validateHexColor(color, 'color', { required: false }) : '#B0E0E6';

    const existing = await prisma.expenseCategory.findFirst({ where: { householdId, name: validName } });
    if (existing) {
      return res.status(409).json({ error: 'Category with this name already exists' });
    }

    const category = await prisma.expenseCategory.create({
      data: {
        name: validName,
        icon: validIcon,
        color: validColor,
        householdId
      }
    });

    invalidateCache.dashboard(householdId);
    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    const statusCode = error.message.includes('must') || error.message.includes('valid') ? 400 : 500;
    const message = statusCode === 400 ? error.message : 'Failed to create category';
    res.status(statusCode).json({ error: message });
  }
});

// Update category
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, icon, color } = req.body;
  const { householdId } = req;

  try {
    // Validate id
    const validId = validateString(id, 'id', { maxLength: 50 });

    const existing = await prisma.expenseCategory.findFirst({ where: { id: validId, householdId } });
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Validate updates if provided
    const updateData = {};
    if (name) {
      const validName = validateString(name, 'name', { minLength: 1, maxLength: 100 });
      if (validName !== existing.name) {
        const duplicate = await prisma.expenseCategory.findFirst({ where: { householdId, name: validName } });
        if (duplicate) {
          return res.status(409).json({ error: 'Category with this name already exists' });
        }
      }
      updateData.name = validName;
    }
    if (icon) {
      updateData.icon = validateIconName(icon, 'icon', { required: false });
    }
    if (color) {
      updateData.color = validateHexColor(color, 'color', { required: false });
    }

    const category = await prisma.expenseCategory.update({
      where: { id: validId },
      data: updateData
    });

    invalidateCache.dashboard(householdId);
    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    const statusCode = error.message.includes('must') || error.message.includes('valid') ? 400 : 500;
    const message = statusCode === 400 ? error.message : 'Failed to update category';
    res.status(statusCode).json({ error: message });
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
