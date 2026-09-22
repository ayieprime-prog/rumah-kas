const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  const { title, description, startDate, allDay, category } = req.body;
  const { householdId } = req;

  if (!title || !startDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const event = await prisma.event.create({
      data: { title, description, startDate: new Date(startDate), allDay: allDay ?? true, category, householdId }
    });
    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// List events, optionally filtered by month (YYYY-MM)
router.get('/', async (req, res) => {
  const { householdId } = req;
  const { month } = req.query;

  try {
    const where = { householdId };
    if (month) {
      const [year, monthNum] = month.split('-');
      const startDate = new Date(`${year}-${monthNum}-01`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59);
      where.startDate = { gte: startDate, lte: endDate };
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { startDate: 'asc' }
    });
    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, startDate, allDay, category } = req.body;
  const { householdId } = req;

  try {
    const existing = await prisma.event.findFirst({ where: { id, householdId } });
    if (!existing) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = await prisma.event.update({
      where: { id },
      data: { title, description, startDate: startDate ? new Date(startDate) : undefined, allDay, category }
    });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update event' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { householdId } = req;

  try {
    const existing = await prisma.event.findFirst({ where: { id, householdId } });
    if (!existing) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await prisma.event.delete({ where: { id } });
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

module.exports = router;
