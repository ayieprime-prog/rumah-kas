// Dummy data seeder untuk testing
// Jalankan: npm run seed:dummy (setelah DATABASE_URL configured)

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedDummy() {
  try {
    console.log('🌱 Seeding dummy data...\n');

    // 0. Clean up any previous test data (cascade deletes users/expenses/income)
    console.log('🧹 Removing previous test household, if any...');
    await prisma.household.deleteMany({ where: { name: 'Keluarga Budi - Test' } });

    // 1. Create Household
    console.log('📦 Creating household...');
    const household = await prisma.household.create({
      data: {
        name: 'Keluarga Budi - Test',
        currency: 'IDR'
      }
    });
    console.log(`✅ Household created: ${household.name}\n`);

    // 2. Create Users
    console.log('👥 Creating users...');

    const admin = await prisma.user.create({
      data: {
        email: 'admin@rumahkas.test',
        password: await bcrypt.hash('AdminTest123!', 10),
        name: 'Admin Budi',
        role: 'ADMIN',
        householdId: household.id
      }
    });
    console.log(`✅ Admin user: ${admin.email}`);

    const member = await prisma.user.create({
      data: {
        email: 'member@rumahkas.test',
        password: await bcrypt.hash('MemberTest123!', 10),
        name: 'Istri Budi',
        role: 'MEMBER',
        householdId: household.id
      }
    });
    console.log(`✅ Member user: ${member.email}\n`);

    // 3. Create Expense Categories
    console.log('📂 Creating expense categories...');
    const categories = await Promise.all([
      prisma.expenseCategory.create({
        data: { name: 'Groceries', householdId: household.id }
      }),
      prisma.expenseCategory.create({
        data: { name: 'Utilities', householdId: household.id }
      }),
      prisma.expenseCategory.create({
        data: { name: 'Transportation', householdId: household.id }
      }),
      prisma.expenseCategory.create({
        data: { name: 'Entertainment', householdId: household.id }
      })
    ]);
    console.log(`✅ ${categories.length} categories created\n`);

    // 4. Create Sample Expenses
    console.log('💸 Creating sample expenses...');
    const expenses = await Promise.all([
      prisma.expense.create({
        data: {
          description: 'Weekly groceries',
          amount: 500000,
          categoryId: categories[0].id,
          date: new Date('2026-09-20'),
          householdId: household.id
        }
      }),
      prisma.expense.create({
        data: {
          description: 'Electric bill',
          amount: 250000,
          categoryId: categories[1].id,
          date: new Date('2026-09-15'),
          householdId: household.id
        }
      }),
      prisma.expense.create({
        data: {
          description: 'Gas for car',
          amount: 150000,
          categoryId: categories[2].id,
          date: new Date('2026-09-19'),
          householdId: household.id
        }
      }),
      prisma.expense.create({
        data: {
          description: 'Movie tickets',
          amount: 100000,
          categoryId: categories[3].id,
          date: new Date('2026-09-18'),
          householdId: household.id
        }
      })
    ]);
    console.log(`✅ ${expenses.length} expenses created\n`);

    // 5. Create Sample Income
    console.log('💰 Creating sample income...');
    const income = await prisma.income.create({
      data: {
        source: 'Salary',
        amount: 5000000,
        date: new Date('2026-09-01'),
        householdId: household.id
      }
    });
    console.log(`✅ Income created\n`);

    console.log('✨ Dummy data seeding completed!\n');
    console.log('📋 Test Credentials:');
    console.log('   Admin Email: admin@rumahkas.test');
    console.log('   Admin Password: AdminTest123!');
    console.log('   Member Email: member@rumahkas.test');
    console.log('   Member Password: MemberTest123!\n');

    console.log('📊 Summary:');
    console.log(`   Households: 1`);
    console.log(`   Users: 2`);
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Expenses: ${expenses.length}`);
    console.log(`   Income: 1\n`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedDummy();
