const express = require('express');
const router = express.Router();
const { PrismaClient, AssetType } = require('@prisma/client');
const prisma = new PrismaClient();

const handleError = (res, error, defaultMsg) => {
  console.error(error);
  res.status(500).json({ error: defaultMsg || 'Server error' });
};

// Get all assets for household
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { household: true }
    });

    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const assets = await prisma.asset.findMany({
      where: { householdId: user.householdId },
      include: {
        valuations: {
          orderBy: { date: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const portfolio = {
      assets,
      summary: {
        totalValue: assets.reduce((sum, a) => sum + a.currentValue, 0),
        byType: Object.values(AssetType).map(type => ({
          type,
          count: assets.filter(a => a.type === type).length,
          value: assets.filter(a => a.type === type).reduce((sum, a) => sum + a.currentValue, 0)
        }))
      }
    };

    res.json(portfolio);
  } catch (error) {
    handleError(res, error, 'Failed to fetch assets');
  }
});

// Get single asset with full history
router.get('/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { household: true }
    });

    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const asset = await prisma.asset.findFirst({
      where: {
        id: req.params.id,
        householdId: user.householdId
      },
      include: {
        valuations: {
          orderBy: { date: 'desc' }
        }
      }
    });

    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    res.json(asset);
  } catch (error) {
    handleError(res, error, 'Failed to fetch asset');
  }
});

// Create new asset
router.post('/', async (req, res) => {
  try {
    const userId = req.userId;
    const { name, type, description, currentValue, purchasePrice, purchaseDate, currency, location, notes } = req.body;

    if (!name || !type || currentValue === undefined) {
      return res.status(400).json({ error: 'Missing required fields: name, type, currentValue' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { household: true }
    });

    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const asset = await prisma.asset.create({
      data: {
        name,
        type,
        description,
        currentValue: parseFloat(currentValue),
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        currency: currency || 'IDR',
        location,
        notes,
        householdId: user.householdId,
        valuations: {
          create: {
            value: parseFloat(currentValue),
            date: new Date()
          }
        }
      },
      include: {
        valuations: true
      }
    });

    res.status(201).json(asset);
  } catch (error) {
    handleError(res, error, 'Failed to create asset');
  }
});

// Update asset
router.put('/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const { name, type, description, currentValue, purchasePrice, purchaseDate, currency, location, notes } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { household: true }
    });

    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // Verify asset ownership
    const existing = await prisma.asset.findFirst({
      where: {
        id: req.params.id,
        householdId: user.householdId
      }
    });

    if (!existing) return res.status(404).json({ error: 'Asset not found' });

    // Create new valuation if currentValue changed
    const shouldCreateValuation = currentValue !== undefined && currentValue !== existing.currentValue;

    const asset = await prisma.asset.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(description !== undefined && { description }),
        ...(currentValue !== undefined && { currentValue: parseFloat(currentValue) }),
        ...(purchasePrice !== undefined && { purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null }),
        ...(purchaseDate !== undefined && { purchaseDate: purchaseDate ? new Date(purchaseDate) : null }),
        ...(currency && { currency }),
        ...(location !== undefined && { location }),
        ...(notes !== undefined && { notes }),
        ...(shouldCreateValuation && {
          valuations: {
            create: {
              value: parseFloat(currentValue),
              date: new Date()
            }
          }
        })
      },
      include: {
        valuations: {
          orderBy: { date: 'desc' },
          take: 5
        }
      }
    });

    res.json(asset);
  } catch (error) {
    handleError(res, error, 'Failed to update asset');
  }
});

// Delete asset
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { household: true }
    });

    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // Verify asset ownership
    const existing = await prisma.asset.findFirst({
      where: {
        id: req.params.id,
        householdId: user.householdId
      }
    });

    if (!existing) return res.status(404).json({ error: 'Asset not found' });

    await prisma.asset.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true, message: 'Asset deleted' });
  } catch (error) {
    handleError(res, error, 'Failed to delete asset');
  }
});

// Get asset valuation history for charting
router.get('/:id/valuations', async (req, res) => {
  try {
    const userId = req.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { household: true }
    });

    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const asset = await prisma.asset.findFirst({
      where: {
        id: req.params.id,
        householdId: user.householdId
      }
    });

    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    const valuations = await prisma.assetValuation.findMany({
      where: { assetId: req.params.id },
      orderBy: { date: 'asc' },
      take: 100
    });

    res.json({
      assetId: asset.id,
      assetName: asset.name,
      valuations: valuations.map(v => ({
        date: v.date.toISOString().split('T')[0],
        value: v.value
      }))
    });
  } catch (error) {
    handleError(res, error, 'Failed to fetch valuations');
  }
});

module.exports = router;
