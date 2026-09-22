const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { logAudit } = require('../utils/audit');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  const { name, targetAmount, targetDate, description } = req.body;
  const { householdId, userId } = req;

  try {
    const goal = await prisma.$transaction(async (tx) => {
      const created = await tx.goal.create({
        data: {
          name,
          targetAmount: parseFloat(targetAmount),
          targetDate: new Date(targetDate),
          description,
          householdId
        }
      });
      await logAudit(tx, {
        userId, householdId, action: 'CREATE_GOAL', entity: 'GOAL', entityId: created.id,
        summary: `${name} - target Rp${created.targetAmount.toLocaleString('id-ID')}`
      });
      return created;
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
  const { householdId, userId } = req;

  try {
    const existing = await prisma.goal.findFirst({ where: { id, householdId } });
    if (!existing) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const goal = await prisma.$transaction(async (tx) => {
      const updated = await tx.goal.update({
        where: { id },
        data: {
          name,
          targetAmount: targetAmount ? parseFloat(targetAmount) : undefined,
          targetDate: targetDate ? new Date(targetDate) : undefined,
          currentAmount: currentAmount !== undefined ? parseFloat(currentAmount) : undefined,
          description
        }
      });
      const action = currentAmount !== undefined ? 'ADD_GOAL_FUNDS' : 'UPDATE_GOAL';
      const summary = currentAmount !== undefined
        ? `${updated.name} - terkumpul Rp${updated.currentAmount.toLocaleString('id-ID')} / Rp${updated.targetAmount.toLocaleString('id-ID')}`
        : `${updated.name} - target Rp${updated.targetAmount.toLocaleString('id-ID')}`;
      await logAudit(tx, { userId, householdId, action, entity: 'GOAL', entityId: id, summary });
      return updated;
    });
    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { householdId, userId } = req;

  try {
    const existing = await prisma.goal.findFirst({ where: { id, householdId } });
    if (!existing) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.goal.delete({ where: { id } });
      await logAudit(tx, {
        userId, householdId, action: 'DELETE_GOAL', entity: 'GOAL', entityId: id,
        summary: `${existing.name} - Rp${existing.currentAmount.toLocaleString('id-ID')} / Rp${existing.targetAmount.toLocaleString('id-ID')}`
      });
    });
    res.json({ message: 'Goal deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

module.exports = router;
