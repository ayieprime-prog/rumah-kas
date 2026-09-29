const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get todos for household. ?date=YYYY-MM-DD returns only items due that day
// (used by the "Agenda Hari Ini" widget); without it, returns everything.
router.get('/', async (req, res) => {
  const { householdId } = req;
  const { date } = req.query;

  try {
    const where = { householdId };
    if (date) {
      // Parsed as UTC (trailing Z) to match how "today" is computed
      // elsewhere (toISOString().slice(0,10)) and how dueDate is stored -
      // parsing as server-local time here would shift which day a todo
      // "belongs to" by the server's UTC offset.
      const dayStart = new Date(`${date}T00:00:00.000Z`);
      const dayEnd = new Date(`${date}T23:59:59.999Z`);
      where.dueDate = { gte: dayStart, lte: dayEnd };
    }

    const todos = await prisma.todo.findMany({
      where,
      orderBy: { dueDate: 'asc' }
    });

    res.json(todos);
  } catch (error) {
    console.error('Get todos error:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// Create todo
router.post('/', async (req, res) => {
  const { title, category, dueDate, reminderOption } = req.body;
  const { householdId } = req;

  if (!title || !dueDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const todo = await prisma.todo.create({
      data: {
        title,
        category: category || null,
        dueDate: new Date(dueDate),
        reminderOption: reminderOption || null,
        householdId
      }
    });

    res.status(201).json(todo);
  } catch (error) {
    console.error('Create todo error:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// Update todo (mainly toggling completed, but any field can be edited)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, category, dueDate, reminderOption, completed } = req.body;
  const { householdId } = req;

  try {
    const existing = await prisma.todo.findFirst({ where: { id, householdId } });
    if (!existing) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const todo = await prisma.todo.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(category !== undefined && { category: category || null }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(reminderOption !== undefined && { reminderOption: reminderOption || null }),
        ...(completed !== undefined && { completed })
      }
    });

    res.json(todo);
  } catch (error) {
    console.error('Update todo error:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// Delete todo
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { householdId } = req;

  try {
    const existing = await prisma.todo.findFirst({ where: { id, householdId } });
    if (!existing) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    await prisma.todo.delete({ where: { id } });

    res.json({ message: 'Todo deleted' });
  } catch (error) {
    console.error('Delete todo error:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

module.exports = router;
