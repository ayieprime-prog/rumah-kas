const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { logAudit } = require('../utils/audit');

const router = express.Router();
const prisma = new PrismaClient();

async function adjustWalletBalance(tx, walletId, delta) {
  if (!walletId || !delta) return;
  await tx.wallet.update({ where: { id: walletId }, data: { balance: { increment: delta } } });
}

router.post('/', async (req, res) => {
  const { source, amount, date, walletId } = req.body;
  const { householdId, userId } = req;

  try {
    if (walletId) {
      const wallet = await prisma.wallet.findFirst({ where: { id: walletId, householdId } });
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }
    }

    const parsedAmount = parseFloat(amount);
    const income = await prisma.$transaction(async (tx) => {
      const created = await tx.income.create({
        data: { source, amount: parsedAmount, date: new Date(date), householdId, walletId: walletId || null },
        include: { wallet: true }
      });
      await adjustWalletBalance(tx, walletId, parsedAmount);
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
        include: { wallet: true },
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
  const { source, amount, date, walletId } = req.body;
  const { householdId, userId } = req;

  try {
    const existing = await prisma.income.findFirst({ where: { id, householdId } });
    if (!existing) {
      return res.status(404).json({ error: 'Income not found' });
    }

    if (walletId && walletId !== existing.walletId) {
      const wallet = await prisma.wallet.findFirst({ where: { id: walletId, householdId } });
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }
    }

    const newAmount = amount ? parseFloat(amount) : existing.amount;
    const newWalletId = walletId !== undefined ? (walletId || null) : existing.walletId;

    const income = await prisma.$transaction(async (tx) => {
      const updated = await tx.income.update({
        where: { id },
        data: {
          ...(source && { source }),
          ...(amount && { amount: newAmount }),
          ...(date && { date: new Date(date) }),
          ...(walletId !== undefined && { walletId: newWalletId })
        },
        include: { wallet: true }
      });
      // Reverse the old wallet impact, apply the new one (handles wallet or amount changes)
      await adjustWalletBalance(tx, existing.walletId, -existing.amount);
      await adjustWalletBalance(tx, newWalletId, newAmount);
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
      await adjustWalletBalance(tx, existing.walletId, -existing.amount);
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
