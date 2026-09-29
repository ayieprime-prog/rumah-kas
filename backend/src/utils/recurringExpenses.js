/**
 * Recurring Expense Generation
 *
 * Turns due RecurringExpense rules into real Expense rows. A rule is "due"
 * once for every interval that has elapsed since its last generation (or
 * its startDate, if it has never generated anything yet), so a rule that
 * missed runs (e.g. the scheduler was down) catches up rather than losing
 * occurrences - bounded by MAX_OCCURRENCES_PER_RUN per rule per call so a
 * long-dormant DAILY rule can't generate unbounded rows in one pass.
 */

const { invalidateCache } = require('./caching');

const MAX_OCCURRENCES_PER_RUN = 366;

function nextOccurrence(date, frequency) {
  const next = new Date(date);
  switch (frequency) {
    case 'DAILY':
      next.setDate(next.getDate() + 1);
      break;
    case 'WEEKLY':
      next.setDate(next.getDate() + 7);
      break;
    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'YEARLY':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      throw new Error(`Unknown recurrence frequency: ${frequency}`);
  }
  return next;
}

const monthOf = (date) => date.toISOString().slice(0, 7);

async function adjustBudgetSpent(tx, householdId, month, categoryId, delta) {
  const budget = await tx.budget.findUnique({
    where: { householdId_month_categoryId: { householdId, month, categoryId } }
  });
  if (!budget) return;
  await tx.budget.update({ where: { id: budget.id }, data: { spent: Math.max(0, budget.spent + delta) } });
}

async function adjustWalletBalance(tx, walletId, delta) {
  if (!walletId) return;
  await tx.wallet.update({ where: { id: walletId }, data: { balance: { decrement: delta } } });
}

/**
 * Generate all due occurrences for a single rule, up to `now`.
 * Returns the number of Expense rows created.
 */
async function generateForRule(prisma, rule, now) {
  let occurrenceDate = rule.lastGeneratedAt ? nextOccurrence(rule.lastGeneratedAt, rule.frequency) : rule.startDate;
  let generated = 0;

  while (
    occurrenceDate <= now &&
    (!rule.endDate || occurrenceDate <= rule.endDate) &&
    generated < MAX_OCCURRENCES_PER_RUN
  ) {
    await prisma.$transaction(async (tx) => {
      await tx.expense.create({
        data: {
          description: rule.description,
          amount: rule.amount,
          date: occurrenceDate,
          householdId: rule.householdId,
          categoryId: rule.categoryId,
          walletId: rule.walletId,
          isRecurring: true,
          recurringId: rule.id
        }
      });

      await adjustBudgetSpent(tx, rule.householdId, monthOf(occurrenceDate), rule.categoryId, rule.amount);
      await adjustWalletBalance(tx, rule.walletId, rule.amount);

      await tx.recurringExpense.update({
        where: { id: rule.id },
        data: { lastGeneratedAt: occurrenceDate }
      });
    });

    generated++;
    invalidateCache.dashboard(rule.householdId);
    occurrenceDate = nextOccurrence(occurrenceDate, rule.frequency);
  }

  return generated;
}

/**
 * Process every active recurring rule that's due, across all households.
 * Returns { rulesProcessed, expensesGenerated }.
 */
async function processDueRecurringExpenses(prisma) {
  const now = new Date();
  const rules = await prisma.recurringExpense.findMany({
    where: {
      isActive: true,
      startDate: { lte: now }
    }
  });

  let rulesProcessed = 0;
  let expensesGenerated = 0;

  for (const rule of rules) {
    try {
      const count = await generateForRule(prisma, rule, now);
      if (count > 0) rulesProcessed++;
      expensesGenerated += count;
    } catch (error) {
      console.error(`Error generating recurring expense for rule ${rule.id}:`, error);
    }
  }

  return { rulesProcessed, expensesGenerated };
}

module.exports = { processDueRecurringExpenses };
