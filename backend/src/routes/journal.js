const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  const { content, mood, entryDate } = req.body;
  const { householdId, userId } = req;

  if (!content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const entry = await prisma.journalEntry.create({
      data: {
        content,
        mood,
        entryDate: entryDate ? new Date(entryDate) : new Date(),
        authorId: userId,
        householdId
      },
      include: { author: { select: { id: true, name: true } } }
    });
    res.status(201).json(entry);
  } catch (error) {
    console.error('Create journal entry error:', error);
    res.status(500).json({ error: 'Failed to create journal entry' });
  }
});

router.get('/', async (req, res) => {
  const { householdId } = req;
  const { limit = 50, offset = 0 } = req.query;

  try {
    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where: { householdId },
        include: { author: { select: { id: true, name: true } } },
        orderBy: { entryDate: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.journalEntry.count({ where: { householdId } })
    ]);
    res.json({ entries, total });
  } catch (error) {
    console.error('Get journal entries error:', error);
    res.status(500).json({ error: 'Failed to fetch journal entries' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { householdId } = req;

  try {
    const existing = await prisma.journalEntry.findFirst({ where: { id, householdId } });
    if (!existing) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    await prisma.journalEntry.delete({ where: { id } });
    res.json({ message: 'Journal entry deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete journal entry' });
  }
});

module.exports = router;
