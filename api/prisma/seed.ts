import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const stamps = [
    { id: 'stamp-heart', name: 'Trái tim', image: '❤️', color: '#c0392b', price: 5000 },
    { id: 'stamp-flower', name: 'Hoa anh đào', image: '🌸', color: '#e8a0b4', price: 5000 },
    { id: 'stamp-moon', name: 'Trăng khuyết', image: '🌙', color: '#8aa4b5', price: 7000 },
    { id: 'stamp-star', name: 'Ngôi sao', image: '⭐', color: '#d4a93c', price: 7000 },
    { id: 'stamp-rose', name: 'Hồng đỏ', image: '🌹', color: '#a52a3a', price: 10000 },
  ];
  for (const s of stamps) {
    await prisma.stamp.upsert({ where: { id: s.id }, update: {}, create: s });
  }
}
main().finally(() => prisma.$disconnect());
