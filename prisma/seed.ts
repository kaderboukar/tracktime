

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient()

async function main() {
  // Création de l'utilisateur ADMIN
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@undp.org' },
    update: {},
    create: {
      email: 'admin@undp.org',
      password: await bcrypt.hash('Admin@123', 10),
      name: 'Admin User',
      indice: 'ADMIN001',
      grade: 'G7',
      type: 'OPERATION',
      role: 'ADMIN',
      signature: '/bk7.png',  // Ajout du chemin de la signature
      isActive: true,
    },
  })

  // Création de l'utilisateur PMSU
  const pmsuUser = await prisma.user.upsert({
    where: { email: 'pmsu@undp.org' },
    update: {},
    create: {
      email: 'pmsu@undp.org',
      password: await bcrypt.hash('Pmsu@123', 10),
      name: 'PMSU User',
      indice: 'PMSU001',
      grade: 'G6',
      type: 'SUPPORT',
      role: 'PMSU',
      signature: '/kad.png',  // Ajout du chemin de la signature
      isActive: true,
    },
  })

  console.log({ adminUser, pmsuUser })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
