const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  const { name, totalAmount, monthlyPayment, startDate, endDate, creditor } = req.body;
  const { householdId } = req;

  try {
    const debt = await prisma.debt.create({
      data: {
        name,
        totalAmount: parseFloat(totalAmount),
        monthlyPayment: parseFloat(monthlyPayment),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        creditor,
        householdId
      }
    });
    res.status(201).json(debt);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create debt' });
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

  try {
    const debt = await prisma.debt.update({
      where: { id },
      data: {
        name,
        totalAmount: totalAmount ? parseFloat(totalAmount) : undefined,
        paidAmount: paidAmount !== undefined ? parseFloat(paidAmount) : undefined,
        monthlyPayment: monthlyPayment ? parseFloat(monthlyPayment) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        creditor
      }
    });
    res.json(debt);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update debt' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.debt.delete({ where: { id } });
    res.json({ message: 'Debt deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete debt' });
  }
});

module.exports = router;
