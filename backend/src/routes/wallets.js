const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { authenticate } = require('../middleware/auth')
const { invalidateCache } = require('../utils/caching')

const router = express.Router()
const prisma = new PrismaClient()

// Get all wallets for household
router.get('/', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { household: true }
    })

    if (!user) return res.status(404).json({ error: 'User not found' })

    const wallets = await prisma.wallet.findMany({
      where: { householdId: user.householdId },
      orderBy: { createdAt: 'asc' }
    })

    res.json(wallets)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch wallets' })
  }
})

// Get wallet summary with balance
router.get('/summary', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { household: true }
    })

    if (!user) return res.status(404).json({ error: 'User not found' })

    const wallets = await prisma.wallet.findMany({
      where: { householdId: user.householdId, isActive: true }
    })

    const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0)

    res.json({
      totalBalance,
      walletCount: wallets.length,
      wallets
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch wallet summary' })
  }
})

// Create wallet
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, type, balance, icon, scope } = req.body

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' })
    }

    if (scope && !['KELUARGA', 'PRIBADI'].includes(scope)) {
      return res.status(400).json({ error: 'Scope must be one of: KELUARGA, PRIBADI' })
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { household: true }
    })

    if (!user) return res.status(404).json({ error: 'User not found' })

    const wallet = await prisma.wallet.create({
      data: {
        name,
        type,
        balance: balance || 0,
        icon: icon || 'wallet',
        scope: scope || 'KELUARGA',
        householdId: user.householdId
      }
    })

    invalidateCache.dashboard(user.householdId)
    res.status(201).json(wallet)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create wallet' })
  }
})

// Update wallet
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, type, balance, isActive, scope } = req.body
    const walletId = req.params.id

    if (scope && !['KELUARGA', 'PRIBADI'].includes(scope)) {
      return res.status(400).json({ error: 'Scope must be one of: KELUARGA, PRIBADI' })
    }

    const wallet = await prisma.wallet.findUnique({ where: { id: walletId } })
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' })

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { household: true }
    })

    if (wallet.householdId !== user.householdId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const updated = await prisma.wallet.update({
      where: { id: walletId },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(balance !== undefined && { balance }),
        ...(isActive !== undefined && { isActive }),
        ...(scope && { scope })
      }
    })

    invalidateCache.dashboard(user.householdId)
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update wallet' })
  }
})

// Delete wallet
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const walletId = req.params.id

    const wallet = await prisma.wallet.findUnique({ where: { id: walletId } })
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' })

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { household: true }
    })

    if (wallet.householdId !== user.householdId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    // One transaction so a crash partway through can't leave expenses/
    // incomes detached from a wallet that still exists, or vice versa.
    await prisma.$transaction([
      prisma.expense.updateMany({ where: { walletId }, data: { walletId: null } }),
      prisma.income.updateMany({ where: { walletId }, data: { walletId: null } }),
      prisma.wallet.delete({ where: { id: walletId } })
    ])

    invalidateCache.dashboard(user.householdId)
    res.json({ message: 'Wallet deleted' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete wallet' })
  }
})

module.exports = router
