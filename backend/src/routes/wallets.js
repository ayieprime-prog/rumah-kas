import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

// Get all wallets for household
router.get('/', authMiddleware, async (req, res) => {
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
router.get('/summary', authMiddleware, async (req, res) => {
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
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, type, balance, icon } = req.body

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' })
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
        householdId: user.householdId
      }
    })

    res.status(201).json(wallet)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create wallet' })
  }
})

// Update wallet
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, type, balance, isActive } = req.body
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

    const updated = await prisma.wallet.update({
      where: { id: walletId },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(balance !== undefined && { balance }),
        ...(isActive !== undefined && { isActive })
      }
    })

    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update wallet' })
  }
})

// Delete wallet
router.delete('/:id', authMiddleware, async (req, res) => {
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

    // Set all expenses/incomes using this wallet to NULL
    await prisma.expense.updateMany({
      where: { walletId },
      data: { walletId: null }
    })

    await prisma.income.updateMany({
      where: { walletId },
      data: { walletId: null }
    })

    // Delete wallet
    await prisma.wallet.delete({ where: { id: walletId } })

    res.json({ message: 'Wallet deleted' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete wallet' })
  }
})

export default router
