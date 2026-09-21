const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  const { month, limit, categoryId } = req.body;
  const { householdId } = req;

  try {
    const budget = await prisma.budget.create({
      data: {
        month,
        limit: parseFloat(limit),
        householdId,
        categoryId
      },
      include: { category: true }
    });
    res.status(201).json(budget);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create budget' });
  }
});

router.get('/', async (req, res) => {
  const { householdId } = req;
  const { month } = req.query;

  try {
    const where = { householdId };
    if (month) where.month = month;

    const budgets = await prisma.budget.findMany({
      where,
      include: { category: true },
      orderBy: { month: 'desc' }
    });

    res.json(budgets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { limit } = req.body;

  try {
    const budget = await prisma.budget.update({
      where: { id },
      data: { limit: parseFloat(limit) },
      include: { category: true }
    });
    res.json(budget);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update budget' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.budget.delete({ where: { id } });
    res.json({ message: 'Budget deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});

module.exports = router;
