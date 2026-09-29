const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { invalidateCache } = require('../utils/caching');

const router = express.Router();
const prisma = new PrismaClient();

const handlePrismaError = (err, res) => {
  console.error('Database error:', err.message);
  res.status(500).json({ error: 'Database error' });
};

// GET /api/transfers - List user's transfers (pending and completed)
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const transfers = await prisma.transfer.findMany({
      where: { householdId: user.householdId },
      include: {
        fromWallet: { select: { id: true, name: true, balance: true } },
        toWallet: { select: { id: true, name: true, balance: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      transfers,
      summary: {
        pending: transfers.filter(t => t.status === 'PENDING').length,
        completed: transfers.filter(t => t.status === 'COMPLETED').length,
        rejected: transfers.filter(t => t.status === 'REJECTED').length
      }
    });
  } catch (err) {
    handlePrismaError(err, res);
  }
});

// GET /api/transfers/pending - List pending transfers for approval
router.get('/pending', async (req, res) => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const pendingTransfers = await prisma.transfer.findMany({
      where: {
        householdId: user.householdId,
        status: 'PENDING'
      },
      include: {
        fromWallet: { select: { id: true, name: true, balance: true } },
        toWallet: { select: { id: true, name: true, balance: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(pendingTransfers);
  } catch (err) {
    handlePrismaError(err, res);
  }
});

// POST /api/transfers - Initiate a new transfer
// Body: { fromWalletId, toWalletId, amount, note, recipientId? }
router.post('/', async (req, res) => {
  try {
    const userId = req.userId;
    const { fromWalletId, toWalletId, amount, note, recipientId } = req.body;

    if (!fromWalletId || !toWalletId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Missing or invalid required fields' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Verify both wallets belong to the same household
    const fromWallet = await prisma.wallet.findFirst({
      where: { id: fromWalletId, householdId: user.householdId }
    });

    const toWallet = await prisma.wallet.findFirst({
      where: { id: toWalletId, householdId: user.householdId }
    });

    if (!fromWallet || !toWallet) {
      return res.status(404).json({ error: 'One or both wallets not found' });
    }

    if (fromWallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Determine transfer status: if same user, auto-complete; if different user, require approval
    const isSameUser = recipientId === null || recipientId === undefined;
    const status = isSameUser ? 'COMPLETED' : 'PENDING';

    // Transfer creation and (for the auto-complete case) both wallet balance
    // updates all happen in one DB transaction: a crash or error partway
    // through rolls back everything instead of leaving one wallet debited
    // without the other credited. The `balance: { gte: amount }` guard on
    // the decrement makes it a single atomic check-and-update, closing the
    // race window a separate read-then-compare would leave open between
    // concurrent transfers off the same wallet.
    const transfer = await prisma.$transaction(async (tx) => {
      const created = await tx.transfer.create({
        data: {
          fromWalletId,
          toWalletId,
          amount,
          note,
          recipientId,
          initiatedById: userId,
          status,
          approvedBy: isSameUser ? userId : null,
          approvedAt: isSameUser ? new Date() : null,
          householdId: user.householdId
        },
        include: {
          fromWallet: { select: { id: true, name: true } },
          toWallet: { select: { id: true, name: true } }
        }
      });

      if (isSameUser) {
        const debited = await tx.wallet.updateMany({
          where: { id: fromWalletId, balance: { gte: amount } },
          data: { balance: { decrement: amount } }
        });
        if (debited.count === 0) {
          const err = new Error('Insufficient balance');
          err.statusCode = 400;
          throw err;
        }

        await tx.wallet.update({
          where: { id: toWalletId },
          data: { balance: { increment: amount } }
        });
      }

      return created;
    });

    if (isSameUser) invalidateCache.dashboard(user.householdId);
    res.status(201).json(transfer);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    handlePrismaError(err, res);
  }
});

// PUT /api/transfers/:id/approve - Approve a pending transfer, then execute it
// Body: { approvedBy? (defaults to req.userId) }
router.put('/:id/approve', async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const transfer = await prisma.transfer.findFirst({
      where: { id, householdId: user.householdId }
    });

    if (!transfer) return res.status(404).json({ error: 'Transfer not found' });

    // APPROVED is accepted here too (not just PENDING): if a previous call
    // got as far as marking it APPROVED but crashed before the wallet
    // balances were moved, calling approve again safely resumes from there
    // instead of leaving the transfer permanently stuck - no money has
    // moved yet at that point, so re-attempting the transaction is safe.
    if (transfer.status !== 'PENDING' && transfer.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Only pending transfers can be approved' });
    }

    if (transfer.status === 'PENDING') {
      await prisma.transfer.update({
        where: { id },
        data: { status: 'APPROVED', approvedBy: userId, approvedAt: new Date() }
      });
    }

    // Both wallet balance updates and the final COMPLETED status write are
    // one DB transaction: either the whole transfer executes, or (on a
    // crash, error, or insufficient balance discovered here) none of it
    // does and the transfer stays at APPROVED, safely retryable - never a
    // state where one wallet is debited without the other being credited.
    const completedTransfer = await prisma.$transaction(async (tx) => {
      const debited = await tx.wallet.updateMany({
        where: { id: transfer.fromWalletId, balance: { gte: transfer.amount } },
        data: { balance: { decrement: transfer.amount } }
      });
      if (debited.count === 0) {
        const err = new Error('Insufficient balance in source wallet');
        err.statusCode = 400;
        throw err;
      }

      await tx.wallet.update({
        where: { id: transfer.toWalletId },
        data: { balance: { increment: transfer.amount } }
      });

      return tx.transfer.update({
        where: { id },
        data: { status: 'COMPLETED' },
        include: {
          fromWallet: { select: { id: true, name: true, balance: true } },
          toWallet: { select: { id: true, name: true, balance: true } }
        }
      });
    });

    invalidateCache.dashboard(user.householdId);
    res.json(completedTransfer);
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    handlePrismaError(err, res);
  }
});

// PUT /api/transfers/:id/reject - Reject a pending transfer
// Body: { reason? }
router.put('/:id/reject', async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { reason } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const transfer = await prisma.transfer.findFirst({
      where: { id, householdId: user.householdId }
    });

    if (!transfer) return res.status(404).json({ error: 'Transfer not found' });

    if (transfer.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending transfers can be rejected' });
    }

    const rejectedTransfer = await prisma.transfer.update({
      where: { id },
      data: {
        status: 'REJECTED'
      },
      include: {
        fromWallet: { select: { id: true, name: true } },
        toWallet: { select: { id: true, name: true } }
      }
    });

    res.json(rejectedTransfer);
  } catch (err) {
    handlePrismaError(err, res);
  }
});

// DELETE /api/transfers/:id - Delete a transfer (only if PENDING or REJECTED)
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const transfer = await prisma.transfer.findFirst({
      where: { id, householdId: user.householdId }
    });

    if (!transfer) return res.status(404).json({ error: 'Transfer not found' });

    // APPROVED is safe to delete too: no wallet balance changes happen
    // until the approve endpoint's own $transaction executes, so an
    // approved-but-not-yet-executed transfer can still be cancelled outright.
    if (!['PENDING', 'REJECTED', 'APPROVED'].includes(transfer.status)) {
      return res.status(400).json({ error: 'Cannot delete completed transfers' });
    }

    await prisma.transfer.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Transfer deleted' });
  } catch (err) {
    handlePrismaError(err, res);
  }
});

module.exports = router;
