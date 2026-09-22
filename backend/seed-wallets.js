const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEFAULT_WALLETS = [
  { name: 'Tunai', type: 'CASH', icon: 'Banknote' },
  { name: 'BCA', type: 'BANK_ACCOUNT', icon: 'CreditCard' },
  { name: 'Dompet Digital', type: 'DIGITAL_WALLET', icon: 'Smartphone' }
];

async function seedWallets() {
  try {
    const households = await prisma.household.findMany();

    for (const household of households) {
      console.log(`Processing household: ${household.name} (${household.id})`);

      // Check if wallets already exist
      const existingWallets = await prisma.wallet.count({
        where: { householdId: household.id }
      });

      if (existingWallets === 0) {
        console.log(`  No wallets found. Creating default wallets...`);

        for (const wallet of DEFAULT_WALLETS) {
          const created = await prisma.wallet.create({
            data: {
              ...wallet,
              householdId: household.id,
              balance: 0
            }
          });
          console.log(`  ✓ Created wallet: ${created.name}`);
        }
      } else {
        console.log(`  Wallets already exist (${existingWallets}). Skipping.`);
      }
    }

    console.log('\n✅ Wallet seeding completed!');
  } catch (error) {
    console.error('Error seeding wallets:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedWallets();
