const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get household details
router.get('/', async (req, res) => {
  const { householdId } = req;

  try {
    const household = await prisma.household.findUnique({
      where: { id: householdId },
      include: {
        users: { select: { id: true, name: true, email: true, role: true } },
        categories: true
      }
    });

    res.json(household);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch household' });
  }
});

// Invite member (spouse)
router.post('/invite-member', async (req, res) => {
  const { email, name } = req.body;
  const { householdId, userRole } = req;

  if (userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admin can invite members' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'User already registered' });
    }

    // For MVP, create user with default password (should be improved with email verification)
    const defaultPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'MEMBER',
        householdId
      }
    });

    res.status(201).json({
      message: 'Member invited successfully',
      user: { id: user.id, email: user.email, name: user.name },
      temporaryPassword: defaultPassword // Should be sent via email in production
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to invite member' });
  }
});

// Get household members
router.get('/members', async (req, res) => {
  const { householdId } = req;

  try {
    const users = await prisma.user.findMany({
      where: { householdId },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// Update household settings
router.put('/settings', async (req, res) => {
  const { householdId } = req;
  const { name, currency } = req.body;

  try {
    const household = await prisma.household.update({
      where: { id: householdId },
      data: { ...(name && { name }), ...(currency && { currency }) }
    });

    res.json(household);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
