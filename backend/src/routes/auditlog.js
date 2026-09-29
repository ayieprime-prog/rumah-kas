const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { validatePagination } = require('../utils/validation');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  const { householdId } = req;

  try {
    // Validate pagination parameters
    const { limit, offset } = validatePagination(req.query);

    const logs = await prisma.auditLog.findMany({
      where: { householdId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });
    res.json(logs);
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({ error: 'Failed to fetch activity log' });
  }
});

module.exports = router;
