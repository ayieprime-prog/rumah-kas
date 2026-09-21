const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  const { source, amount, date } = req.body;
  const { householdId } = req;

  try {
    const income = await prisma.income.create({
      data: { source, amount: parseFloat(amount), date: new Date(date), householdId }
    });
    res.status(201).json(income);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create income' });
  }
});

router.get('/', async (req, res) => {
  const { householdId } = req;
  const { month, limit = 50, offset = 0 } = req.query;

  try {
    const where = { householdId };
    if (month) {
      const [year, monthNum] = month.split('-');
      const startDate = new Date(`${year}-${monthNum}-01`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      where.date = { gte: startDate, lte: endDate };
    }

    const [incomes, total] = await Promise.all([
      prisma.income.findMany({
        where,
        orderBy: { date: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.income.count({ where })
    ]);

    res.json({ incomes, total });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch income' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { source, amount, date } = req.body;
  const { householdId } = req;

  try {
    const existing = await prisma.income.findFirst({ where: { id, householdId } });
    if (!existing) {
      return res.status(404).json({ error: 'Income not found' });
    }

    const income = await prisma.income.update({
      where: { id },
      data: { source, amount: amount ? parseFloat(amount) : undefined, date: date ? new Date(date) : undefined }
    });
    res.json(income);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update income' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { householdId } = req;

  try {
    const existing = await prisma.income.findFirst({ where: { id, householdId } });
    if (!existing) {
      return res.status(404).json({ error: 'Income not found' });
    }

    await prisma.income.delete({ where: { id } });
    res.json({ message: 'Income deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete income' });
  }
});

module.exports = router;
