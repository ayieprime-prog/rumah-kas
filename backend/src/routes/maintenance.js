const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Create maintenance item
router.post('/', async (req, res) => {
  const { name, type, intervalDays, notes } = req.body;
  const { householdId } = req;

  if (!name || !type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const item = await prisma.maintenanceItem.create({
      data: { name, type, intervalDays: intervalDays ? parseInt(intervalDays) : null, notes, householdId }
    });
    res.status(201).json(item);
  } catch (error) {
    console.error('Create maintenance item error:', error);
    res.status(500).json({ error: 'Failed to create maintenance item' });
  }
});

// List maintenance items with their latest log
router.get('/', async (req, res) => {
  const { householdId } = req;

  try {
    const items = await prisma.maintenanceItem.findMany({
      where: { householdId },
      include: { logs: { orderBy: { serviceDate: 'desc' }, take: 1 } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(items);
  } catch (error) {
    console.error('Get maintenance items error:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance items' });
  }
});

// Update maintenance item
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, type, intervalDays, notes } = req.body;
  const { householdId } = req;

  try {
    const existing = await prisma.maintenanceItem.findFirst({ where: { id, householdId } });
    if (!existing) {
      return res.status(404).json({ error: 'Maintenance item not found' });
    }

    const item = await prisma.maintenanceItem.update({
      where: { id },
      data: { name, type, intervalDays: intervalDays !== undefined ? (intervalDays ? parseInt(intervalDays) : null) : undefined, notes }
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update maintenance item' });
  }
});

// Delete maintenance item
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { householdId } = req;

  try {
    const existing = await prisma.maintenanceItem.findFirst({ where: { id, householdId } });
    if (!existing) {
      return res.status(404).json({ error: 'Maintenance item not found' });
    }

    await prisma.maintenanceItem.delete({ where: { id } });
    res.json({ message: 'Maintenance item deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete maintenance item' });
  }
});

// Log a service, recalculating the next due date, optionally recording it as an expense too
router.post('/:id/log', async (req, res) => {
  const { id } = req.params;
  const { serviceDate, cost, notes, recordAsExpense, categoryId } = req.body;
  const { householdId } = req;

  if (!serviceDate) {
    return res.status(400).json({ error: 'serviceDate is required' });
  }

  try {
    const item = await prisma.maintenanceItem.findFirst({ where: { id, householdId } });
    if (!item) {
      return res.status(404).json({ error: 'Maintenance item not found' });
    }

    if (recordAsExpense && cost && !categoryId) {
      return res.status(400).json({ error: 'categoryId is required to record as expense' });
    }

    const parsedCost = cost ? parseFloat(cost) : null;
    const serviceDateObj = new Date(serviceDate);
    const nextDueDate = item.intervalDays
      ? new Date(serviceDateObj.getTime() + item.intervalDays * 24 * 60 * 60 * 1000)
      : null;

    const result = await prisma.$transaction(async (tx) => {
      const log = await tx.maintenanceLog.create({
        data: { maintenanceItemId: id, serviceDate: serviceDateObj, cost: parsedCost, notes }
      });

      const updatedItem = await tx.maintenanceItem.update({
        where: { id },
        data: { lastServiceDate: serviceDateObj, nextDueDate }
      });

      if (recordAsExpense && parsedCost && categoryId) {
        const category = await tx.expenseCategory.findFirst({ where: { id: categoryId, householdId } });
        if (!category) {
          throw new Error('Invalid category for expense');
        }
        await tx.expense.create({
          data: {
            description: `Maintenance: ${item.name}`,
            amount: parsedCost,
            date: serviceDateObj,
            categoryId,
            householdId
          }
        });
      }

      return { log, item: updatedItem };
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Log maintenance service error:', error);
    res.status(500).json({ error: error.message || 'Failed to log service' });
  }
});

module.exports = router;
