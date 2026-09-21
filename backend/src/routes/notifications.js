const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get notifications
router.get('/', async (req, res) => {
  const { householdId } = req;
  const { unreadOnly = false } = req.query;

  try {
    const notifications = await prisma.notification.findMany({
      where: {
        householdId,
        ...(unreadOnly === 'true' && { read: false })
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  const { id } = req.params;

  try {
    const notification = await prisma.notification.update({
      where: { id },
      data: { read: true }
    });

    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Mark all as read
router.put('/mark-all-read', async (req, res) => {
  const { householdId } = req;

  try {
    await prisma.notification.updateMany({
      where: { householdId, read: false },
      data: { read: true }
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.notification.delete({ where: { id } });
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

module.exports = router;
