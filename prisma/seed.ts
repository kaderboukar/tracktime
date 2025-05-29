

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

  // Création de l'utilisateur STAFF de test
  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@undp.org' },
    update: {},
    create: {
      email: 'staff@undp.org',
      password: await bcrypt.hash('Staff@123', 10),
      name: 'John Doe',
      indice: 'STAFF001',
      grade: 'G5',
      type: 'OPERATION',
      role: 'STAFF',
      signature: '/bk7.png',  // Ajout du chemin de la signature
      isActive: true,
    },
  })

  // Création d'un coût proforma pour l'utilisateur STAFF
  const staffProformaCost = await prisma.userProformaCost.upsert({
    where: {
      userId_year: {
        userId: staffUser.id,
        year: 2025
      }
    },
    update: {},
    create: {
      userId: staffUser.id,
      year: 2025,
      cost: 75000, // 75,000 USD par an
    },
  })

  // Création de quelques projets de test
  const project1 = await prisma.project.upsert({
    where: { projectNumber: 'PROJ001' },
    update: {},
    create: {
      name: 'Projet Développement Durable',
      projectNumber: 'PROJ001',
      projectType: 'Programme',
      staffAccess: 'ALL',
    },
  })

  const project2 = await prisma.project.upsert({
    where: { projectNumber: 'PROJ002' },
    update: {},
    create: {
      name: 'Initiative Climat',
      projectNumber: 'PROJ002',
      projectType: 'Opération',
      staffAccess: 'OPERATION',
    },
  })

  // Assignation des projets à l'utilisateur STAFF
  const userProject1 = await prisma.userProject.upsert({
    where: {
      userId_projectId: {
        userId: staffUser.id,
        projectId: project1.id
      }
    },
    update: {},
    create: {
      userId: staffUser.id,
      projectId: project1.id,
      allocationPercentage: 60.0,
    },
  })

  const userProject2 = await prisma.userProject.upsert({
    where: {
      userId_projectId: {
        userId: staffUser.id,
        projectId: project2.id
      }
    },
    update: {},
    create: {
      userId: staffUser.id,
      projectId: project2.id,
      allocationPercentage: 40.0,
    },
  })

  // Création d'activités de test
  const activity1 = await prisma.activity.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Gestion de Projet',
      parentId: null,
    },
  })

  const activity2 = await prisma.activity.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Planification',
      parentId: activity1.id,
    },
  })

  const activity3 = await prisma.activity.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: 'Suivi et Évaluation',
      parentId: activity1.id,
    },
  })

  const activity4 = await prisma.activity.upsert({
    where: { id: 4 },
    update: {},
    create: {
      name: 'Recherche et Développement',
      parentId: null,
    },
  })

  const activity5 = await prisma.activity.upsert({
    where: { id: 5 },
    update: {},
    create: {
      name: 'Analyse de Données',
      parentId: activity4.id,
    },
  })

  // Création d'entrées de temps de test pour l'utilisateur STAFF
  const timeEntry1 = await prisma.timeEntry.upsert({
    where: { id: 1 },
    update: {},
    create: {
      userId: staffUser.id,
      projectId: project1.id,
      activityId: activity2.id,
      semester: 'S1',
      year: 2025,
      hours: 25.5,
      status: 'APPROVED',
      comment: 'Planification du projet développement durable',
    },
  })

  const timeEntry2 = await prisma.timeEntry.upsert({
    where: { id: 2 },
    update: {},
    create: {
      userId: staffUser.id,
      projectId: project2.id,
      activityId: activity5.id,
      semester: 'S1',
      year: 2025,
      hours: 18.0,
      status: 'APPROVED',
      comment: 'Analyse des données climatiques',
    },
  })

  const timeEntry3 = await prisma.timeEntry.upsert({
    where: { id: 3 },
    update: {},
    create: {
      userId: staffUser.id,
      projectId: project1.id,
      activityId: activity3.id,
      semester: 'S1',
      year: 2025,
      hours: 32.0,
      status: 'PENDING',
      comment: 'Suivi des indicateurs de performance',
    },
  })

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
}
