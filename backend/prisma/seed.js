const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default expense categories
  const categories = [
    { name: 'Makanan & Minuman', icon: 'utensils', color: '#FF6B6B' },
    { name: 'Transportasi', icon: 'car', color: '#4ECDC4' },
    { name: 'Utilitas', icon: 'zap', color: '#FFE66D' },
    { name: 'Kesehatan', icon: 'heart', color: '#FF6B9D' },
    { name: 'Pendidikan', icon: 'book', color: '#95E1D3' },
    { name: 'Hiburan', icon: 'music', color: '#A8E6CF' },
    { name: 'Belanja', icon: 'shopping-bag', color: '#FFB6B9' },
    { name: 'Cicilan', icon: 'credit-card', color: '#FEC8D8' },
    { name: 'Investasi', icon: 'trending-up', color: '#C7CEEA' },
    { name: 'Lainnya', icon: 'folder', color: '#B0E0E6' },
  ];

  console.log('✅ Default categories ready (will be created per household)');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
