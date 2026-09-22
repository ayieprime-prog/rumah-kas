// Dummy data seeder untuk testing menyeluruh -- mencakup semua fitur Phase A + B.
// Jalankan otomatis saat startup di environment Development (lihat SEED_DUMMY_DATA
// di package.json "start" script). Idempotent: selalu hapus dulu household test
// lama ("Keluarga Budi - Test") sebelum membuat ulang, jadi aman dijalankan
// berkali-kali tanpa numpuk data duplikat.

const { PrismaClient, AssetType } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const HOUSEHOLD_NAME = 'Keluarga Budi - Test';
const d = (s) => new Date(s);

async function seedDummy() {
  try {
    console.log('🌱 Seeding dummy data...\n');

    console.log('🧹 Removing previous test household, if any...');
    await prisma.household.deleteMany({ where: { name: HOUSEHOLD_NAME } });

    console.log('📦 Creating household...');
    const household = await prisma.household.create({
      data: { name: HOUSEHOLD_NAME, currency: 'IDR' }
    });

    console.log('👥 Creating users...');
    const admin = await prisma.user.create({
      data: {
        email: 'admin@rumahkas.test',
        password: await bcrypt.hash('AdminTest123!', 10),
        name: 'Budi (Admin)',
        role: 'ADMIN',
        householdId: household.id
      }
    });
    const member = await prisma.user.create({
      data: {
        email: 'member@rumahkas.test',
        password: await bcrypt.hash('MemberTest123!', 10),
        name: 'Sari (Istri)',
        role: 'MEMBER',
        householdId: household.id
      }
    });
    console.log(`✅ 2 users created\n`);

    console.log('💼 Creating wallets...');
    const walletBalance = { tunai: 500000, bca: 3000000, gopay: 500000 };
    const walletTunai = await prisma.wallet.create({
      data: { name: 'Tunai', type: 'CASH', balance: walletBalance.tunai, icon: 'Banknote', householdId: household.id }
    });
    const walletBca = await prisma.wallet.create({
      data: { name: 'BCA', type: 'BANK_ACCOUNT', balance: walletBalance.bca, icon: 'CreditCard', householdId: household.id }
    });
    const walletGopay = await prisma.wallet.create({
      data: { name: 'GoPay', type: 'DIGITAL_WALLET', balance: walletBalance.gopay, icon: 'Smartphone', householdId: household.id }
    });
    console.log(`✅ 3 wallets created\n`);

    console.log('📂 Creating expense categories...');
    const categoryDefs = [
      { name: 'Makanan & Minuman', icon: 'utensils', color: '#FF6B6B' },
      { name: 'Transportasi', icon: 'car', color: '#4ECDC4' },
      { name: 'Utilitas', icon: 'zap', color: '#FFE66D' },
      { name: 'Kesehatan', icon: 'heart', color: '#FF6B9D' },
      { name: 'Pendidikan', icon: 'book', color: '#95E1D3' },
      { name: 'Hiburan', icon: 'music', color: '#A8E6CF' },
      { name: 'Belanja', icon: 'shopping-bag', color: '#FFB6B9' },
      { name: 'Cicilan', icon: 'credit-card', color: '#FEC8D8' },
      { name: 'Investasi', icon: 'trending-up', color: '#C7CEEA' },
      { name: 'Lainnya', icon: 'folder', color: '#B0E0E6' }
    ];
    const categories = {};
    for (const c of categoryDefs) {
      categories[c.name] = await prisma.expenseCategory.create({ data: { ...c, householdId: household.id } });
    }
    console.log(`✅ ${categoryDefs.length} categories created\n`);

    // Track wallet running balances as we add income/expenses, so the final
    // stored balance matches what the real app would compute (see the
    // adjustWalletBalance fix in routes/expenses.js and routes/income.js).
    const runningBalance = { ...walletBalance };
    const spentByMonthCategory = {}; // "2026-09|Makanan & Minuman" -> total

    const addExpense = async ({ description, amount, categoryName, date, walletKey }) => {
      const walletId = { tunai: walletTunai.id, bca: walletBca.id, gopay: walletGopay.id }[walletKey];
      await prisma.expense.create({
        data: { description, amount, date: d(date), householdId: household.id, categoryId: categories[categoryName].id, walletId }
      });
      runningBalance[walletKey] -= amount;
      const month = date.slice(0, 7);
      const key = `${month}|${categoryName}`;
      spentByMonthCategory[key] = (spentByMonthCategory[key] || 0) + amount;
    };

    const addIncome = async ({ source, amount, date, walletKey }) => {
      const walletId = { tunai: walletTunai.id, bca: walletBca.id, gopay: walletGopay.id }[walletKey];
      await prisma.income.create({
        data: { source, amount, date: d(date), householdId: household.id, walletId }
      });
      runningBalance[walletKey] += amount;
    };

    console.log('💰 Creating income across 3 months...');
    for (const month of ['2026-07', '2026-08', '2026-09']) {
      await addIncome({ source: 'Gaji Budi', amount: 8000000, date: `${month}-01`, walletKey: 'bca' });
      await addIncome({ source: 'Gaji Sari', amount: 5000000, date: `${month}-01`, walletKey: 'bca' });
    }
    await addIncome({ source: 'Bonus THR', amount: 3000000, date: '2026-09-10', walletKey: 'bca' });
    console.log('✅ Income created\n');

    console.log('💸 Creating expenses across 3 months...');
    for (const month of ['2026-07', '2026-08', '2026-09']) {
      await addExpense({ description: 'Belanja mingguan', amount: 500000, categoryName: 'Makanan & Minuman', date: `${month}-05`, walletKey: 'bca' });
      await addExpense({ description: 'Listrik', amount: 350000, categoryName: 'Utilitas', date: `${month}-20`, walletKey: 'bca' });
      await addExpense({ description: 'Internet', amount: 300000, categoryName: 'Utilitas', date: `${month}-20`, walletKey: 'bca' });
      await addExpense({ description: 'Cicilan motor', amount: 800000, categoryName: 'Cicilan', date: `${month}-25`, walletKey: 'bca' });
    }
    // One-off items on cash/e-wallet, kept to September only so those small
    // wallets don't run negative across the 3-month recurring loop above.
    await addExpense({ description: 'Makan di luar', amount: 250000, categoryName: 'Makanan & Minuman', date: '2026-09-15', walletKey: 'tunai' });
    await addExpense({ description: 'Bensin motor', amount: 150000, categoryName: 'Transportasi', date: '2026-09-10', walletKey: 'tunai' });
    await addExpense({ description: 'Vitamin keluarga', amount: 200000, categoryName: 'Kesehatan', date: '2026-09-12', walletKey: 'gopay' });
    await addExpense({ description: 'Nonton bioskop', amount: 150000, categoryName: 'Hiburan', date: '2026-09-18', walletKey: 'gopay' });
    await addExpense({ description: 'Baju anak', amount: 300000, categoryName: 'Belanja', date: '2026-09-08', walletKey: 'bca' });
    console.log('✅ Expenses created\n');

    console.log('💼 Updating wallet balances to match transaction history...');
    await prisma.wallet.update({ where: { id: walletTunai.id }, data: { balance: runningBalance.tunai } });
    await prisma.wallet.update({ where: { id: walletBca.id }, data: { balance: runningBalance.bca } });
    await prisma.wallet.update({ where: { id: walletGopay.id }, data: { balance: runningBalance.gopay } });
    console.log('✅ Wallet balances updated\n');

    console.log('📊 Creating budgets for current month (September 2026)...');
    const budgetPlan = [
      { categoryName: 'Makanan & Minuman', limit: 2000000 },
      { categoryName: 'Transportasi', limit: 500000 },
      { categoryName: 'Utilitas', limit: 1000000 },
      { categoryName: 'Hiburan', limit: 300000 }
    ];
    for (const b of budgetPlan) {
      await prisma.budget.create({
        data: {
          month: '2026-09',
          limit: b.limit,
          spent: spentByMonthCategory[`2026-09|${b.categoryName}`] || 0,
          householdId: household.id,
          categoryId: categories[b.categoryName].id
        }
      });
    }
    console.log(`✅ ${budgetPlan.length} budgets created\n`);

    console.log('🎯 Creating savings goals...');
    await prisma.goal.create({
      data: { name: 'Liburan ke Bali', targetAmount: 20000000, currentAmount: 5000000, targetDate: d('2027-06-01'), description: 'Liburan keluarga akhir tahun ajaran', householdId: household.id }
    });
    await prisma.goal.create({
      data: { name: 'Dana Darurat', targetAmount: 30000000, currentAmount: 12000000, targetDate: d('2026-12-31'), description: 'Target 6x pengeluaran bulanan', householdId: household.id }
    });
    console.log('✅ 2 goals created\n');

    console.log('💳 Creating debt...');
    await prisma.debt.create({
      data: {
        name: 'Cicilan Motor', totalAmount: 15000000, paidAmount: 6000000, monthlyPayment: 800000,
        startDate: d('2026-01-10'), endDate: d('2027-06-10'), creditor: 'Bank ABC', householdId: household.id
      }
    });
    console.log('✅ Debt created\n');

    console.log('🏠 Creating assets with valuation history...');
    await prisma.asset.create({
      data: {
        name: 'Rumah di Bekasi', type: AssetType.REAL_ESTATE, currentValue: 850000000, purchasePrice: 750000000,
        purchaseDate: d('2020-05-15'), location: 'Bekasi, Jawa Barat', householdId: household.id,
        valuations: { create: [{ value: 750000000, date: d('2020-05-15') }, { value: 850000000, date: d('2026-09-01') }] }
      }
    });
    await prisma.asset.create({
      data: {
        name: 'Motor Honda Vario', type: AssetType.VEHICLE, currentValue: 15000000, purchasePrice: 20000000,
        purchaseDate: d('2022-03-01'), householdId: household.id,
        valuations: { create: [{ value: 20000000, date: d('2022-03-01') }, { value: 15000000, date: d('2026-09-01') }] }
      }
    });
    console.log('✅ 2 assets created\n');

    console.log('📅 Creating calendar events...');
    await prisma.event.create({ data: { title: 'Ulang tahun Sari', startDate: d('2026-10-12'), allDay: true, category: 'Ulang Tahun', householdId: household.id } });
    await prisma.event.create({ data: { title: 'Kontrol dokter anak', startDate: d('2026-09-28'), allDay: false, category: 'Kesehatan', householdId: household.id } });
    await prisma.event.create({ data: { title: 'Servis motor rutin', startDate: d('2026-10-05'), allDay: true, category: 'Maintenance', householdId: household.id } });
    console.log('✅ 3 events created\n');

    console.log('🔗 Creating important links...');
    await prisma.importantLink.create({ data: { title: 'BPJS Kesehatan', url: 'https://www.bpjs-kesehatan.go.id', category: 'Kesehatan', householdId: household.id } });
    await prisma.importantLink.create({ data: { title: 'PLN Mobile', url: 'https://www.pln.co.id', category: 'Utilitas', householdId: household.id } });
    await prisma.importantLink.create({ data: { title: 'BCA Mobile', url: 'https://www.bca.co.id', category: 'Bank', householdId: household.id } });
    console.log('✅ 3 links created\n');

    console.log('📔 Creating journal entries...');
    await prisma.journalEntry.create({ data: { content: 'Hari ini berhasil hemat belanja bulanan, senang rasanya!', mood: 'senang', entryDate: d('2026-09-15'), authorId: admin.id, householdId: household.id } });
    await prisma.journalEntry.create({ data: { content: 'Mulai nabung buat liburan Bali tahun depan.', mood: 'semangat', entryDate: d('2026-09-18'), authorId: member.id, householdId: household.id } });
    console.log('✅ 2 journal entries created\n');

    console.log('🔧 Creating maintenance record...');
    const motorMaintenance = await prisma.maintenanceItem.create({
      data: { name: 'Motor Honda Vario', type: 'Kendaraan', intervalDays: 90, lastServiceDate: d('2026-07-05'), nextDueDate: d('2026-10-05'), householdId: household.id }
    });
    await prisma.maintenanceLog.create({
      data: { serviceDate: d('2026-07-05'), cost: 150000, notes: 'Ganti oli & cek rem', maintenanceItemId: motorMaintenance.id }
    });
    console.log('✅ Maintenance record created\n');

    console.log('✨ Dummy data seeding completed!\n');
    console.log('📋 Test Credentials:');
    console.log('   Admin  : admin@rumahkas.test  / AdminTest123!');
    console.log('   Member : member@rumahkas.test / MemberTest123!\n');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedDummy();
