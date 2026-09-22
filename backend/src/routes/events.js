const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  const { title, description, startDate, allDay, category } = req.body;
  const { householdId } = req;

  if (!title || !startDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const event = await prisma.event.create({
      data: { title, description, startDate: new Date(startDate), allDay: allDay ?? true, category, householdId }
    });
    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

const dayKey = (date) => date.toISOString().slice(0, 10);
const clampDay = (year, monthIndex, day) => {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return new Date(year, monthIndex, Math.min(day, lastDay));
};

// List events for a month (YYYY-MM), plus derived transaction markers and
// upcoming-payment reminders (bills/debt, maintenance, expected income) so
// the calendar can show more than just manually-added events.
router.get('/', async (req, res) => {
  const { householdId } = req;
  const { month } = req.query;

  try {
    if (!month) {
      const events = await prisma.event.findMany({ where: { householdId }, orderBy: { startDate: 'asc' } });
      return res.json({ events, transactionDates: {}, reminders: [] });
    }

    const [year, monthNum] = month.split('-').map(Number);
    const monthIndex = monthNum - 1;
    const monthStart = new Date(year, monthIndex, 1);
    const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59);
    const prevMonthStart = new Date(year, monthIndex - 1, 1);

    const [events, expenses, incomes, prevIncomes, debts, maintenanceItems] = await Promise.all([
      prisma.event.findMany({ where: { householdId, startDate: { gte: monthStart, lte: monthEnd } }, orderBy: { startDate: 'asc' } }),
      prisma.expense.findMany({ where: { householdId, date: { gte: monthStart, lte: monthEnd } }, select: { date: true, amount: true } }),
      prisma.income.findMany({ where: { householdId, date: { gte: monthStart, lte: monthEnd } }, select: { date: true, amount: true, source: true } }),
      prisma.income.findMany({ where: { householdId, date: { gte: prevMonthStart, lt: monthStart } }, select: { date: true, amount: true, source: true } }),
      prisma.debt.findMany({ where: { householdId } }),
      prisma.maintenanceItem.findMany({ where: { householdId, nextDueDate: { gte: monthStart, lte: monthEnd } } })
    ]);

    // Mark every day that has a recorded expense and/or income.
    const transactionDates = {};
    for (const e of expenses) {
      const key = dayKey(e.date);
      transactionDates[key] = transactionDates[key] || { income: 0, expense: 0 };
      transactionDates[key].expense += e.amount;
    }
    for (const inc of incomes) {
      const key = dayKey(inc.date);
      transactionDates[key] = transactionDates[key] || { income: 0, expense: 0 };
      transactionDates[key].income += inc.amount;
    }

    const reminders = [];

    // Bills: any debt not fully paid gets a monthly reminder on the day-of-month
    // it started, as long as this month falls within its active window.
    for (const debt of debts) {
      if (debt.paidAmount >= debt.totalAmount) continue;
      if (monthStart < new Date(debt.startDate.getFullYear(), debt.startDate.getMonth(), 1)) continue;
      if (debt.endDate && monthStart > new Date(debt.endDate.getFullYear(), debt.endDate.getMonth(), 1)) continue;
      const dueDate = clampDay(year, monthIndex, debt.startDate.getDate());
      reminders.push({
        type: 'DEBT', title: `Tagihan: ${debt.name}`, date: dayKey(dueDate),
        amount: debt.monthlyPayment, sourceId: debt.id
      });
    }

    // Maintenance: items whose nextDueDate falls in this month.
    for (const item of maintenanceItems) {
      reminders.push({
        type: 'MAINTENANCE', title: `Servis: ${item.name}`, date: dayKey(item.nextDueDate), sourceId: item.id
      });
    }

    // Expected income: sources recorded last month but not yet this month,
    // projected onto the same day-of-month (best-effort recurring detection).
    const incomeSourcesThisMonth = new Set(incomes.map((i) => i.source));
    const seenSources = new Set();
    for (const inc of prevIncomes) {
      if (incomeSourcesThisMonth.has(inc.source) || seenSources.has(inc.source)) continue;
      seenSources.add(inc.source);
      const expectedDate = clampDay(year, monthIndex, inc.date.getDate());
      reminders.push({
        type: 'INCOME', title: `Perkiraan masuk: ${inc.source}`, date: dayKey(expectedDate),
        amount: inc.amount
      });
    }

    reminders.sort((a, b) => a.date.localeCompare(b.date));

    res.json({ events, transactionDates, reminders });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, startDate, allDay, category } = req.body;
  const { householdId } = req;

  try {
    const existing = await prisma.event.findFirst({ where: { id, householdId } });
    if (!existing) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = await prisma.event.update({
      where: { id },
      data: { title, description, startDate: startDate ? new Date(startDate) : undefined, allDay, category }
    });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update event' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { householdId } = req;

  try {
    const existing = await prisma.event.findFirst({ where: { id, householdId } });
    if (!existing) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await prisma.event.delete({ where: { id } });
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

module.exports = router;
