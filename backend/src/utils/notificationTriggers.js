const DUE_SOON_DAYS = 3;

// Debt has no explicit per-cycle due date -- it repeats monthly on the same
// day-of-month as startDate. We only care about the occurrence in the
// current month (borrowers care about "is a payment coming up", not future
// cycles), and we never re-notify for the same computed due date twice.
async function checkDebtPaymentDue(prisma, householdId) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const debts = await prisma.debt.findMany({ where: { householdId } });

  for (const debt of debts) {
    if (debt.paidAmount >= debt.totalAmount) continue; // lunas

    const start = new Date(debt.startDate);
    const due = new Date(today.getFullYear(), today.getMonth(), start.getDate());
    if (debt.endDate && due > new Date(debt.endDate)) continue;

    const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
    if (diffDays < 0 || diffDays > DUE_SOON_DAYS) continue;

    const dueLabel = due.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const message = `Cicilan "${debt.name}" jatuh tempo ${dueLabel}`;

    const alreadyNotified = await prisma.notification.findFirst({
      where: { householdId, type: 'DEBT_PAYMENT_DUE', message }
    });
    if (alreadyNotified) continue;

    await prisma.notification.create({
      data: { type: 'DEBT_PAYMENT_DUE', message, householdId }
    });
  }
}

module.exports = { checkDebtPaymentDue };
