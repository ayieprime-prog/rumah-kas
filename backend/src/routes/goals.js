const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  const { name, targetAmount, targetDate, description } = req.body;
  const { householdId } = req;

  try {
    const goal = await prisma.goal.create({
      data: {
        name,
        targetAmount: parseFloat(targetAmount),
        targetDate: new Date(targetDate),
        description,
        householdId
      }
    });
    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

router.get('/', async (req, res) => {
  const { householdId } = req;

  try {
    const goals = await prisma.goal.findMany({
      where: { householdId },
      orderBy: { targetDate: 'asc' }
    });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, targetAmount, targetDate, currentAmount, description } = req.body;
  const { householdId } = req;

  try {
    const existing = await prisma.goal.findFirst({ where: { id, householdId } });
    if (!existing) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const goal = await prisma.goal.update({
      where: { id },
      data: {
        name,
        targetAmount: targetAmount ? parseFloat(targetAmount) : undefined,
        targetDate: targetDate ? new Date(targetDate) : undefined,
        currentAmount: currentAmount !== undefined ? parseFloat(currentAmount) : undefined,
        description
      }
    });
    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { householdId } = req;

  try {
    const existing = await prisma.goal.findFirst({ where: { id, householdId } });
    if (!existing) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    await prisma.goal.delete({ where: { id } });
    res.json({ message: 'Goal deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

module.exports = router;
