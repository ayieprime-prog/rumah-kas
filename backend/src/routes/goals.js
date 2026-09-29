const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { logAudit } = require('../utils/audit');
const { invalidateCache } = require('../utils/caching');
const { validateString, validateAmount, validateDate } = require('../utils/validation');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  const { name, targetAmount, targetDate, description } = req.body;
  const { householdId, userId } = req;

  try {
    const validName = validateString(name, 'name', { minLength: 1, maxLength: 200 });
    const validTargetAmount = validateAmount(targetAmount, 'targetAmount');
    const validTargetDate = validateDate(targetDate, 'targetDate');
    const validDescription = description ? validateString(description, 'description', { maxLength: 500, required: false }) : null;

    const goal = await prisma.$transaction(async (tx) => {
      const created = await tx.goal.create({
        data: {
          name: validName,
          targetAmount: validTargetAmount,
          targetDate: validTargetDate,
          description: validDescription,
          householdId
        }
      });
      await logAudit(tx, {
        userId, householdId, action: 'CREATE_GOAL', entity: 'GOAL', entityId: created.id,
        summary: `${validName} - target Rp${created.targetAmount.toLocaleString('id-ID')}`
      });
      return created;
    });
    invalidateCache.dashboard(householdId);
    res.status(201).json(goal);
  } catch (error) {
    const statusCode = error.message.includes('must') || error.message.includes('valid') ? 400 : 500;
    const message = statusCode === 400 ? error.message : 'Failed to create goal';
    res.status(statusCode).json({ error: message });
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
    const validId = validateString(id, 'id', { maxLength: 50 });
    const existing = await prisma.goal.findFirst({ where: { id: validId, householdId } });
    if (!existing) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const updateData = {};
    if (name) updateData.name = validateString(name, 'name', { minLength: 1, maxLength: 200 });
    if (targetAmount) updateData.targetAmount = validateAmount(targetAmount, 'targetAmount');
    if (targetDate) updateData.targetDate = validateDate(targetDate, 'targetDate');
    if (currentAmount !== undefined) updateData.currentAmount = validateAmount(currentAmount, 'currentAmount');
    if (description) updateData.description = validateString(description, 'description', { maxLength: 500, required: false });

    const goal = await prisma.$transaction(async (tx) => {
      const updated = await tx.goal.update({
        where: { id: validId },
        data: updateData
      });
      const action = currentAmount !== undefined ? 'ADD_GOAL_FUNDS' : 'UPDATE_GOAL';
      const summary = currentAmount !== undefined
        ? `${updated.name} - terkumpul Rp${updated.currentAmount.toLocaleString('id-ID')} / Rp${updated.targetAmount.toLocaleString('id-ID')}`
        : `${updated.name} - target Rp${updated.targetAmount.toLocaleString('id-ID')}`;
      await logAudit(tx, { userId, householdId, action, entity: 'GOAL', entityId: id, summary });

      if (
        currentAmount !== undefined &&
        existing.currentAmount < existing.targetAmount &&
        updated.currentAmount >= updated.targetAmount
      ) {
        await tx.notification.create({
          data: {
            type: 'GOAL_REACHED',
            message: `Target tabungan "${updated.name}" sudah tercapai! 🎉`,
            householdId
          }
        });
      }

      return updated;
    });
    invalidateCache.dashboard(householdId);
    res.json(goal);
  } catch (error) {
    const statusCode = error.message.includes('must') || error.message.includes('valid') ? 400 : 500;
    const message = statusCode === 400 ? error.message : 'Failed to update goal';
    res.status(statusCode).json({ error: message });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { householdId, userId } = req;

  try {
    const validId = validateString(id, 'id', { maxLength: 50 });
    const existing = await prisma.goal.findFirst({ where: { id: validId, householdId } });
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
    invalidateCache.dashboard(householdId);
    res.json({ message: 'Goal deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

module.exports = router;
