const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  const { title, url, category, notes } = req.body;
  const { householdId } = req;

  if (!title || !url) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const link = await prisma.importantLink.create({
      data: { title, url, category, notes, householdId }
    });
    res.status(201).json(link);
  } catch (error) {
    console.error('Create link error:', error);
    res.status(500).json({ error: 'Failed to create link' });
  }
});

router.get('/', async (req, res) => {
  const { householdId } = req;

  try {
    const links = await prisma.importantLink.findMany({
      where: { householdId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(links);
  } catch (error) {
    console.error('Get links error:', error);
    res.status(500).json({ error: 'Failed to fetch links' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, url, category, notes } = req.body;
  const { householdId } = req;

  try {
    const existing = await prisma.importantLink.findFirst({ where: { id, householdId } });
    if (!existing) {
      return res.status(404).json({ error: 'Link not found' });
    }

    const link = await prisma.importantLink.update({
      where: { id },
      data: { title, url, category, notes }
    });
    res.json(link);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update link' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { householdId } = req;

  try {
    const existing = await prisma.importantLink.findFirst({ where: { id, householdId } });
    if (!existing) {
      return res.status(404).json({ error: 'Link not found' });
    }

    await prisma.importantLink.delete({ where: { id } });
    res.json({ message: 'Link deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete link' });
  }
});

module.exports = router;
