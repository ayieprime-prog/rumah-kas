const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { logAudit } = require('../utils/audit');
const { invalidateCache } = require('../utils/caching');
const { validateString, validateAmount, validateDate } = require('../utils/validation');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  const { name, totalAmount, monthlyPayment, startDate, endDate, creditor } = req.body;
  const { householdId, userId } = req;

  try {
    const validName = validateString(name, 'name', { minLength: 1, maxLength: 200 });
    const validTotalAmount = validateAmount(totalAmount, 'totalAmount');
    const validMonthlyPayment = validateAmount(monthlyPayment, 'monthlyPayment');
    const validStartDate = validateDate(startDate, 'startDate');
    const validEndDate = endDate ? validateDate(endDate, 'endDate', { required: false }) : null;
    const validCreditor = creditor ? validateString(creditor, 'creditor', { maxLength: 200, required: false }) : null;

    const debt = await prisma.$transaction(async (tx) => {
      const created = await tx.debt.create({
        data: {
          name: validName,
          totalAmount: validTotalAmount,
          monthlyPayment: validMonthlyPayment,
          startDate: validStartDate,
          endDate: validEndDate,
          creditor: validCreditor,
          householdId
        }
      });
      await logAudit(tx, {
        userId, householdId, action: 'CREATE_DEBT', entity: 'DEBT', entityId: created.id,
        summary: `${validName} - Rp${created.totalAmount.toLocaleString('id-ID')}`
      });
      return created;
    });
    invalidateCache.dashboard(householdId);
    res.status(201).json(debt);
  } catch (error) {
    const statusCode = error.message.includes('must') || error.message.includes('valid') ? 400 : 500;
    const message = statusCode === 400 ? error.message : 'Failed to create debt';
    res.status(statusCode).json({ error: message });
  }
});

router.get('/', async (req, res) => {
  const { householdId } = req;

  try {
    const debts = await prisma.debt.findMany({
      where: { householdId },
      orderBy: { endDate: 'asc' }
    });
    res.json(debts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch debts' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, totalAmount, paidAmount, monthlyPayment, startDate, endDate, creditor } = req.body;
  const { householdId, userId } = req;

  try {
    const validId = validateString(id, 'id', { maxLength: 50 });

    const existing = await prisma.debt.findFirst({ where: { id: validId, householdId } });
    if (!existing) {
      return res.status(404).json({ error: 'Debt not found' });
    }

    const updateData = {};
    if (name) updateData.name = validateString(name, 'name', { minLength: 1, maxLength: 200 });
    if (totalAmount) updateData.totalAmount = validateAmount(totalAmount, 'totalAmount');
    if (paidAmount !== undefined) updateData.paidAmount = validateAmount(paidAmount, 'paidAmount');
    if (monthlyPayment) updateData.monthlyPayment = validateAmount(monthlyPayment, 'monthlyPayment');
    if (startDate) updateData.startDate = validateDate(startDate, 'startDate');
    if (endDate) updateData.endDate = validateDate(endDate, 'endDate', { required: false });
    if (creditor) updateData.creditor = validateString(creditor, 'creditor', { maxLength: 200, required: false });

    const debt = await prisma.$transaction(async (tx) => {
      const updated = await tx.debt.update({
        where: { id: validId },
        data: updateData
      });
      const action = paidAmount !== undefined ? 'PAY_DEBT_INSTALLMENT' : 'UPDATE_DEBT';
      const summary = paidAmount !== undefined
        ? `${updated.name} - dibayar Rp${updated.paidAmount.toLocaleString('id-ID')} / Rp${updated.totalAmount.toLocaleString('id-ID')}`
        : `${updated.name} - Rp${updated.totalAmount.toLocaleString('id-ID')}`;
      await logAudit(tx, { userId, householdId, action, entity: 'DEBT', entityId: validId, summary });
      return updated;
    });
    invalidateCache.dashboard(householdId);
    res.json(debt);
  } catch (error) {
    const statusCode = error.message.includes('must') || error.message.includes('valid') ? 400 : 500;
    const message = statusCode === 400 ? error.message : 'Failed to update debt';
    res.status(statusCode).json({ error: message });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { householdId, userId } = req;

  try {
    const validId = validateString(id, 'id', { maxLength: 50 });
    const existing = await prisma.debt.findFirst({ where: { id: validId, householdId } });
    if (!existing) {
      return res.status(404).json({ error: 'Debt not found' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.debt.delete({ where: { id } });
      await logAudit(tx, {
        userId, householdId, action: 'DELETE_DEBT', entity: 'DEBT', entityId: id,
        summary: `${existing.name} - Rp${existing.totalAmount.toLocaleString('id-ID')}`
      });
    });
    invalidateCache.dashboard(householdId);
    res.json({ message: 'Debt deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete debt' });
  }
});

module.exports = router;
