const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { logAudit } = require('../utils/audit');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  const { source, amount, date } = req.body;
  const { householdId, userId } = req;

  try {
    const parsedAmount = parseFloat(amount);
    const income = await prisma.$transaction(async (tx) => {
      const created = await tx.income.create({
        data: { source, amount: parsedAmount, date: new Date(date), householdId }
      });
      await logAudit(tx, {
        userId, householdId, action: 'CREATE_INCOME', entity: 'INCOME', entityId: created.id,
        summary: `${source} - Rp${parsedAmount.toLocaleString('id-ID')}`
      });
      return created;
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
  const { householdId, userId } = req;

  try {
    const existing = await prisma.income.findFirst({ where: { id, householdId } });
    if (!existing) {
      return res.status(404).json({ error: 'Income not found' });
    }

    const income = await prisma.$transaction(async (tx) => {
      const updated = await tx.income.update({
        where: { id },
        data: { source, amount: amount ? parseFloat(amount) : undefined, date: date ? new Date(date) : undefined }
      });
      await logAudit(tx, {
        userId, householdId, action: 'UPDATE_INCOME', entity: 'INCOME', entityId: id,
        summary: `${updated.source} - Rp${updated.amount.toLocaleString('id-ID')}`
      });
      return updated;
    });
    res.json(income);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update income' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { householdId, userId } = req;

  try {
    const existing = await prisma.income.findFirst({ where: { id, householdId } });
    if (!existing) {
      return res.status(404).json({ error: 'Income not found' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.income.delete({ where: { id } });
      await logAudit(tx, {
        userId, householdId, action: 'DELETE_INCOME', entity: 'INCOME', entityId: id,
        summary: `${existing.source} - Rp${existing.amount.toLocaleString('id-ID')}`
      });
    });
    res.json({ message: 'Income deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete income' });
  }
});

module.exports = router;
