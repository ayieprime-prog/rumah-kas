const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  const { householdId } = req;
  const { limit = 30 } = req.query;

  try {
    const logs = await prisma.auditLog.findMany({
      where: { householdId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });
    res.json(logs);
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({ error: 'Failed to fetch activity log' });
  }
});

module.exports = router;
