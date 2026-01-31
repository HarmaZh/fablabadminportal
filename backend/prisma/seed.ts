import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@fablab.com' },
    update: {},
    create: {
      email: 'admin@fablab.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      active: true,
    },
  });

  console.log('Created admin user:', { email: admin.email, id: admin.id });

  // Create sample inventory items
  const items = [
    {
      itemId: 'CHOC-001',
      name: 'Chocolate Melter',
      type: 'CHOCOLATE',
      price: 5.00,
      quantity: 2,
      minStock: 1,
      status: 'IN_STOCK',
      notes: 'For melting chocolate',
    },
    {
      itemId: 'SOAP-001',
      name: 'Dental Vacuum Molder',
      type: 'SOAP',
      price: 5.00,
      quantity: 1,
      minStock: 1,
      status: 'IN_STOCK',
      notes: null,
    },
    {
      itemId: 'CHOC-002',
      name: 'White Chocolate',
      type: 'CHOCOLATE',
      price: 5.00,
      quantity: 3,
      minStock: 2,
      status: 'IN_STOCK',
      notes: '3 bags',
    },
    {
      itemId: 'PINS-001',
      name: 'Pin Press',
      type: 'PINS',
      price: 5.00,
      quantity: 1,
      minStock: 1,
      status: 'IN_STOCK',
      notes: null,
    },
    {
      itemId: 'DRONE-001',
      name: 'Drones',
      type: 'DRONES',
      price: 5.00,
      quantity: 4,
      minStock: 2,
      status: 'IN_STOCK',
      notes: null,
    },
    {
      itemId: 'MAT-001',
      name: '3D Printer Filament',
      type: 'MATERIALS',
      price: 25.00,
      quantity: 5,
      minStock: 10,
      status: 'LOW_STOCK',
      notes: 'PLA - Various colors',
    },
  ];

  for (const item of items) {
    await prisma.inventoryItem.upsert({
      where: { itemId: item.itemId },
      update: {},
      create: {
        ...item,
        createdBy: admin.id,
      },
    });
  }

  console.log(`Created ${items.length} inventory items`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
