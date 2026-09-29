const { getMonthRange } = require('./dateRange');

// Berapa yang "dikunci" (dari pendapatan) vs sudah terpakai (dari
// pengeluaran) untuk satu kategori di bulan tertentu.
async function getLockedAllocation(prisma, householdId, categoryId, month) {
  const range = getMonthRange(month);

  const [incomeAgg, expenseAgg] = await Promise.all([
    prisma.income.aggregate({
      where: { householdId, lockedCategoryId: categoryId, date: range },
      _sum: { amount: true }
    }),
    prisma.expense.aggregate({
      where: { householdId, categoryId, date: range },
      _sum: { amount: true }
    })
  ]);

  const allocated = incomeAgg._sum.amount || 0;
  const spent = expenseAgg._sum.amount || 0;
  return { allocated, spent, remaining: allocated - spent };
}

// Ringkasan semua kategori yang punya pendapatan terkunci di bulan ini --
// dipakai halaman Income dan untuk mengoreksi Uang Bebas di dashboard.
async function getAllLockedAllocations(prisma, householdId, month) {
  const range = getMonthRange(month);

  const lockedIncomes = await prisma.income.findMany({
    where: { householdId, lockedCategoryId: { not: null }, date: range },
    include: { lockedCategory: true }
  });

  if (lockedIncomes.length === 0) return { allocations: [], totalRemaining: 0 };

  const categoryIds = [...new Set(lockedIncomes.map(i => i.lockedCategoryId))];
  const expenseSums = await prisma.expense.groupBy({
    by: ['categoryId'],
    where: { householdId, categoryId: { in: categoryIds }, date: range },
    _sum: { amount: true }
  });
  const spentMap = Object.fromEntries(expenseSums.map(e => [e.categoryId, e._sum.amount || 0]));

  const byCategory = {};
  lockedIncomes.forEach((inc) => {
    if (!byCategory[inc.lockedCategoryId]) {
      byCategory[inc.lockedCategoryId] = {
        categoryId: inc.lockedCategoryId,
        categoryName: inc.lockedCategory.name,
        allocated: 0
      };
    }
    byCategory[inc.lockedCategoryId].allocated += inc.amount;
  });

  const allocations = Object.values(byCategory).map((a) => {
    const spent = spentMap[a.categoryId] || 0;
    return { ...a, spent, remaining: a.allocated - spent };
  });

  const totalRemaining = allocations.reduce((sum, a) => sum + Math.max(0, a.remaining), 0);

  return { allocations, totalRemaining };
}

// Dipanggil setelah pengeluaran dibuat/diubah -- kalau kategori ini punya
// kunci dan sudah kebablasan, kirim satu notifikasi (dedup by message,
// jadi tidak akan berulang untuk kategori+bulan yang sama).
async function checkLockExceeded(prisma, householdId, categoryId, month) {
  const { allocated, spent } = await getLockedAllocation(prisma, householdId, categoryId, month);
  if (allocated <= 0 || spent <= allocated) return;

  const category = await prisma.expenseCategory.findUnique({ where: { id: categoryId } });
  const message = `Pengeluaran "${category?.name}" sudah melebihi pendapatan yang dikunci untuk kategori ini bulan ${month}`;

  const alreadyNotified = await prisma.notification.findFirst({
    where: { householdId, type: 'INCOME_LOCK_EXCEEDED', message }
  });
  if (alreadyNotified) return;

  await prisma.notification.create({
    data: { type: 'INCOME_LOCK_EXCEEDED', message, householdId }
  });
}

module.exports = { getLockedAllocation, getAllLockedAllocations, checkLockExceeded };
