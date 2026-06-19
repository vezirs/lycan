const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = 'changeme123';
  const hashed = await bcrypt.hash(password, 10);

  console.log('Seeding admin user...');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@local.test' },
    update: {},
    create: {
      email: 'admin@local.test',
      password: hashed,
      name: 'Admin',
      role: 'owner',
    },
  });

  console.log('Seeding widget...');
  const widget = await prisma.widget.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Demo Widget',
      ownerId: admin.id,
      settings: {
        theme: { primary: '#4F46E5', text: '#ffffff' },
        welcome: 'Bonjour ! Comment puis-je vous aider ?',
        position: 'bottom-right',
      },
    },
  });

  console.log('Seeding conversation...');
  const conversation = await prisma.conversation.create({
    data: {
      widgetId: widget.id,
      title: 'Conversation de démonstration',
      status: 'open',
    },
  });

  console.log('Seeding messages...');
  await prisma.message.createMany({
    data: [
      {
        id: '00000000-0000-0000-0000-000000000101',
        conversationId: conversation.id,
        senderType: 'visitor',
        body: 'Bonjour, je regarde votre site.',
      },
      {
        id: '00000000-0000-0000-0000-000000000102',
        conversationId: conversation.id,
        senderType: 'agent',
        body: "Bonjour ! Je peux vous aider aujourd'hui ?",
      },
    ],
  });

  console.log('Seed finished. Admin credentials: admin@local.test / changeme123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
