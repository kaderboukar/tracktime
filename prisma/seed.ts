

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seeding de la base de données...');

  // ========================================
  // CRÉATION DES UTILISATEURS
  // ========================================
  console.log('👥 Création des utilisateurs...');

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@undp.org' },
    update: {},
    create: {
      email: 'admin@undp.org',
      password: await bcrypt.hash('Admin@123', 10),
      name: 'Admin Principal',
      indice: 'ADMIN001',
      grade: 'G7',
      type: 'OPERATION',
      role: 'ADMIN',
      signature: '/admin-signature.png',
      isActive: true,
    },
  });

  const pmsuUser = await prisma.user.upsert({
    where: { email: 'pmsu@undp.org' },
    update: {},
    create: {
      email: 'pmsu@undp.org',
      password: await bcrypt.hash('Pmsu@123', 10),
      name: 'Manager PMSU',
      indice: 'PMSU001',
      grade: 'G6',
      type: 'SUPPORT',
      role: 'PMSU',
      signature: '/pmsu-signature.png',
      isActive: true,
    },
  });

  const managementUser = await prisma.user.upsert({
    where: { email: 'management@undp.org' },
    update: {},
    create: {
      email: 'management@undp.org',
      password: await bcrypt.hash('Management@123', 10),
      name: 'Directeur Management',
      indice: 'MGMT001',
      grade: 'G8',
      type: 'OPERATION',
      role: 'MANAGEMENT',
      signature: '/management-signature.png',
      isActive: true,
    },
  });

  // Création de plusieurs utilisateurs STAFF
  const staffUsers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'staff1@undp.org' },
      update: {},
      create: {
        email: 'staff1@undp.org',
      password: await bcrypt.hash('Staff@123', 10),
      name: 'John Doe',
      indice: 'STAFF001',
      grade: 'G5',
      type: 'OPERATION',
      role: 'STAFF',
        signature: '/staff1-signature.png',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'staff2@undp.org' },
      update: {},
      create: {
        email: 'staff2@undp.org',
        password: await bcrypt.hash('Staff@123', 10),
        name: 'Jane Smith',
        indice: 'STAFF002',
        grade: 'G5',
        type: 'PROGRAMME',
        role: 'STAFF',
        signature: '/staff2-signature.png',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'staff3@undp.org' },
      update: {},
      create: {
        email: 'staff3@undp.org',
        password: await bcrypt.hash('Staff@123', 10),
        name: 'Mohammed Ali',
        indice: 'STAFF003',
        grade: 'G4',
        type: 'SUPPORT',
        role: 'STAFF',
        signature: '/staff3-signature.png',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'staff4@undp.org' },
      update: {},
      create: {
        email: 'staff4@undp.org',
        password: await bcrypt.hash('Staff@123', 10),
        name: 'Fatima Hassan',
        indice: 'STAFF004',
        grade: 'G6',
        type: 'OPERATION',
        role: 'STAFF',
        signature: '/staff4-signature.png',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'staff5@undp.org' },
      update: {},
      create: {
        email: 'staff5@undp.org',
        password: await bcrypt.hash('Staff@123', 10),
        name: 'Pierre Dubois',
        indice: 'STAFF005',
        grade: 'G5',
        type: 'PROGRAMME',
        role: 'STAFF',
        signature: '/staff5-signature.png',
      isActive: true,
      },
    }),
  ]);

  // ========================================
  // CRÉATION DES COÛTS PROFORMA
  // ========================================
  console.log('💰 Création des coûts proforma...');

  const proformaCosts = await Promise.all([
    // Coûts pour 2024
    ...staffUsers.map(user => 
      prisma.userProformaCost.upsert({
        where: {
          userId_year: {
            userId: user.id,
            year: 2024
          }
        },
        update: {},
        create: {
          userId: user.id,
          year: 2024,
          cost: Math.floor(Math.random() * 30000) + 60000, // 60k-90k USD
        },
      })
    ),
    // Coûts pour 2025
    ...staffUsers.map(user => 
      prisma.userProformaCost.upsert({
    where: {
      userId_year: {
            userId: user.id,
        year: 2025
      }
    },
    update: {},
    create: {
          userId: user.id,
      year: 2025,
          cost: Math.floor(Math.random() * 30000) + 65000, // 65k-95k USD
        },
      })
    ),
  ]);

  // ========================================
  // CRÉATION DES PROJETS
  // ========================================
  console.log('📋 Création des projets...');

  const projects = await Promise.all([
    prisma.project.upsert({
    where: { projectNumber: 'PROJ001' },
    update: {},
    create: {
      name: 'Projet Développement Durable',
      projectNumber: 'PROJ001',
      projectType: 'Programme',
      staffAccess: 'ALL',
    },
    }),
    prisma.project.upsert({
    where: { projectNumber: 'PROJ002' },
    update: {},
    create: {
      name: 'Initiative Climat',
      projectNumber: 'PROJ002',
      projectType: 'Opération',
      staffAccess: 'OPERATION',
    },
    }),
    prisma.project.upsert({
      where: { projectNumber: 'PROJ003' },
      update: {},
      create: {
        name: 'Programme de Réduction de la Pauvreté',
        projectNumber: 'PROJ003',
        projectType: 'Programme',
        staffAccess: 'PROGRAMME',
      },
    }),
    prisma.project.upsert({
      where: { projectNumber: 'PROJ004' },
      update: {},
      create: {
        name: 'Support Institutionnel',
        projectNumber: 'PROJ004',
        projectType: 'Support',
        staffAccess: 'ALL',
      },
    }),
    prisma.project.upsert({
      where: { projectNumber: 'PROJ005' },
      update: {},
      create: {
        name: 'Gestion des Risques',
        projectNumber: 'PROJ005',
        projectType: 'Management',
        staffAccess: 'ALL',
      },
    }),
    prisma.project.upsert({
      where: { projectNumber: 'PROJ006' },
      update: {},
      create: {
        name: 'Innovation Technologique',
        projectNumber: 'PROJ006',
        projectType: 'Programme',
        staffAccess: 'ALL',
      },
    }),
    prisma.project.upsert({
      where: { projectNumber: 'PROJ007' },
      update: {},
      create: {
        name: 'Formation et Capacitation',
        projectNumber: 'PROJ007',
        projectType: 'Opération',
        staffAccess: 'OPERATION',
      },
    }),
    prisma.project.upsert({
      where: { projectNumber: 'PROJ008' },
      update: {},
      create: {
        name: 'Évaluation d\'Impact',
        projectNumber: 'PROJ008',
        projectType: 'Programme',
        staffAccess: 'PROGRAMME',
      },
    }),
  ]);

  // ========================================
  // ASSIGNATION DES PROJETS AUX UTILISATEURS
  // ========================================
  console.log('🔗 Assignation des projets aux utilisateurs...');

  const userProjects = await Promise.all([
    // Staff 1 - Projets 1, 2, 3
    prisma.userProject.upsert({
      where: {
        userId_projectId: {
          userId: staffUsers[0].id,
          projectId: projects[0].id
        }
      },
      update: {},
      create: {
        userId: staffUsers[0].id,
        projectId: projects[0].id,
        allocationPercentage: 40.0,
      },
    }),
    prisma.userProject.upsert({
      where: {
        userId_projectId: {
          userId: staffUsers[0].id,
          projectId: projects[1].id
        }
      },
      update: {},
      create: {
        userId: staffUsers[0].id,
        projectId: projects[1].id,
        allocationPercentage: 35.0,
      },
    }),
    prisma.userProject.upsert({
      where: {
        userId_projectId: {
          userId: staffUsers[0].id,
          projectId: projects[2].id
        }
      },
      update: {},
      create: {
        userId: staffUsers[0].id,
        projectId: projects[2].id,
        allocationPercentage: 25.0,
      },
    }),

    // Staff 2 - Projets 2, 3, 4
    prisma.userProject.upsert({
      where: {
        userId_projectId: {
          userId: staffUsers[1].id,
          projectId: projects[1].id
        }
      },
      update: {},
      create: {
        userId: staffUsers[1].id,
        projectId: projects[1].id,
        allocationPercentage: 50.0,
      },
    }),
    prisma.userProject.upsert({
      where: {
        userId_projectId: {
          userId: staffUsers[1].id,
          projectId: projects[2].id
        }
      },
      update: {},
      create: {
        userId: staffUsers[1].id,
        projectId: projects[2].id,
        allocationPercentage: 30.0,
      },
    }),
    prisma.userProject.upsert({
      where: {
        userId_projectId: {
          userId: staffUsers[1].id,
          projectId: projects[3].id
        }
      },
      update: {},
      create: {
        userId: staffUsers[1].id,
        projectId: projects[3].id,
        allocationPercentage: 20.0,
      },
    }),

    // Staff 3 - Projets 4, 5
    prisma.userProject.upsert({
    where: {
      userId_projectId: {
          userId: staffUsers[2].id,
          projectId: projects[3].id
      }
    },
    update: {},
    create: {
        userId: staffUsers[2].id,
        projectId: projects[3].id,
      allocationPercentage: 60.0,
    },
    }),
    prisma.userProject.upsert({
      where: {
        userId_projectId: {
          userId: staffUsers[2].id,
          projectId: projects[4].id
        }
      },
      update: {},
      create: {
        userId: staffUsers[2].id,
        projectId: projects[4].id,
        allocationPercentage: 40.0,
      },
    }),

    // Staff 4 - Projets 1, 6, 7
    prisma.userProject.upsert({
      where: {
        userId_projectId: {
          userId: staffUsers[3].id,
          projectId: projects[0].id
        }
      },
      update: {},
      create: {
        userId: staffUsers[3].id,
        projectId: projects[0].id,
        allocationPercentage: 30.0,
      },
    }),
    prisma.userProject.upsert({
    where: {
      userId_projectId: {
          userId: staffUsers[3].id,
          projectId: projects[5].id
      }
    },
    update: {},
    create: {
        userId: staffUsers[3].id,
        projectId: projects[5].id,
      allocationPercentage: 40.0,
    },
    }),
    prisma.userProject.upsert({
      where: {
        userId_projectId: {
          userId: staffUsers[3].id,
          projectId: projects[6].id
        }
      },
      update: {},
      create: {
        userId: staffUsers[3].id,
        projectId: projects[6].id,
        allocationPercentage: 30.0,
      },
    }),

    // Staff 5 - Projets 3, 7, 8
    prisma.userProject.upsert({
      where: {
        userId_projectId: {
          userId: staffUsers[4].id,
          projectId: projects[2].id
        }
      },
      update: {},
      create: {
        userId: staffUsers[4].id,
        projectId: projects[2].id,
        allocationPercentage: 35.0,
      },
    }),
    prisma.userProject.upsert({
      where: {
        userId_projectId: {
          userId: staffUsers[4].id,
          projectId: projects[6].id
        }
      },
      update: {},
      create: {
        userId: staffUsers[4].id,
        projectId: projects[6].id,
        allocationPercentage: 35.0,
      },
    }),
    prisma.userProject.upsert({
      where: {
        userId_projectId: {
          userId: staffUsers[4].id,
          projectId: projects[7].id
        }
      },
      update: {},
      create: {
        userId: staffUsers[4].id,
        projectId: projects[7].id,
        allocationPercentage: 30.0,
      },
    }),
  ]);

  // ========================================
  // CRÉATION DES ACTIVITÉS
  // ========================================
  console.log('📝 Création des activités...');

  const activities = await Promise.all([
    // Activités parentes
    prisma.activity.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Gestion de Projet',
      parentId: null,
    },
    }),
    prisma.activity.upsert({
    where: { id: 2 },
    update: {},
    create: {
        name: 'Recherche et Développement',
        parentId: null,
    },
    }),
    prisma.activity.upsert({
    where: { id: 3 },
    update: {},
    create: {
        name: 'Formation et Capacitation',
        parentId: null,
    },
    }),
    prisma.activity.upsert({
    where: { id: 4 },
    update: {},
    create: {
        name: 'Évaluation et Suivi',
      parentId: null,
    },
    }),
    prisma.activity.upsert({
    where: { id: 5 },
      update: {},
      create: {
        name: 'Support Institutionnel',
        parentId: null,
      },
    }),

    // Sous-activités pour Gestion de Projet
    prisma.activity.upsert({
      where: { id: 6 },
      update: {},
      create: {
        name: 'Planification',
        parentId: 1,
      },
    }),
    prisma.activity.upsert({
      where: { id: 7 },
      update: {},
      create: {
        name: 'Coordination',
        parentId: 1,
      },
    }),
    prisma.activity.upsert({
      where: { id: 8 },
      update: {},
      create: {
        name: 'Suivi et Reporting',
        parentId: 1,
      },
    }),

    // Sous-activités pour Recherche et Développement
    prisma.activity.upsert({
      where: { id: 9 },
    update: {},
    create: {
      name: 'Analyse de Données',
        parentId: 2,
      },
    }),
    prisma.activity.upsert({
      where: { id: 10 },
      update: {},
      create: {
        name: 'Études de Faisabilité',
        parentId: 2,
      },
    }),
    prisma.activity.upsert({
      where: { id: 11 },
      update: {},
      create: {
        name: 'Innovation Technologique',
        parentId: 2,
      },
    }),

    // Sous-activités pour Formation et Capacitation
    prisma.activity.upsert({
      where: { id: 12 },
      update: {},
      create: {
        name: 'Formation des Formateurs',
        parentId: 3,
      },
    }),
    prisma.activity.upsert({
      where: { id: 13 },
      update: {},
      create: {
        name: 'Ateliers de Formation',
        parentId: 3,
      },
    }),
    prisma.activity.upsert({
      where: { id: 14 },
      update: {},
      create: {
        name: 'Mentorat',
        parentId: 3,
      },
    }),

    // Sous-activités pour Évaluation et Suivi
    prisma.activity.upsert({
      where: { id: 15 },
      update: {},
      create: {
        name: 'Collecte de Données',
        parentId: 4,
      },
    }),
    prisma.activity.upsert({
      where: { id: 16 },
      update: {},
      create: {
        name: 'Analyse d\'Impact',
        parentId: 4,
      },
    }),
    prisma.activity.upsert({
      where: { id: 17 },
      update: {},
      create: {
        name: 'Rapports d\'Évaluation',
        parentId: 4,
      },
    }),

    // Sous-activités pour Support Institutionnel
    prisma.activity.upsert({
      where: { id: 18 },
      update: {},
      create: {
        name: 'Renforcement des Capacités',
        parentId: 5,
      },
    }),
    prisma.activity.upsert({
      where: { id: 19 },
      update: {},
      create: {
        name: 'Appui Technique',
        parentId: 5,
      },
    }),
    prisma.activity.upsert({
      where: { id: 20 },
      update: {},
      create: {
        name: 'Consultation',
        parentId: 5,
      },
    }),
  ]);

  // ========================================
  // CRÉATION DES ENTRÉES DE TEMPS
  // ========================================
  console.log('⏰ Création des entrées de temps...');

  const timeEntries = await Promise.all([
    // Entrées pour Staff 1 - S1 2024
    prisma.timeEntry.upsert({
    where: { id: 1 },
    update: {},
    create: {
        userId: staffUsers[0].id,
        projectId: projects[0].id,
        activityId: 6, // Planification
      semester: 'S1',
        year: 2024,
      hours: 25.5,
      status: 'APPROVED',
      comment: 'Planification du projet développement durable',
        validatedAt: new Date('2024-03-15'),
        validatedBy: adminUser.id,
    },
    }),
    prisma.timeEntry.upsert({
    where: { id: 2 },
    update: {},
    create: {
        userId: staffUsers[0].id,
        projectId: projects[1].id,
        activityId: 9, // Analyse de Données
      semester: 'S1',
        year: 2024,
      hours: 18.0,
      status: 'APPROVED',
      comment: 'Analyse des données climatiques',
        validatedAt: new Date('2024-03-20'),
        validatedBy: pmsuUser.id,
    },
    }),
    prisma.timeEntry.upsert({
    where: { id: 3 },
    update: {},
    create: {
        userId: staffUsers[0].id,
        projectId: projects[2].id,
        activityId: 8, // Suivi et Reporting
      semester: 'S1',
        year: 2024,
      hours: 32.0,
      status: 'PENDING',
      comment: 'Suivi des indicateurs de performance',
    },
    }),

    // Entrées pour Staff 2 - S1 2024
    prisma.timeEntry.upsert({
      where: { id: 4 },
      update: {},
      create: {
        userId: staffUsers[1].id,
        projectId: projects[1].id,
        activityId: 10, // Études de Faisabilité
        semester: 'S1',
        year: 2024,
        hours: 28.5,
        status: 'APPROVED',
        comment: 'Étude de faisabilité pour l\'initiative climat',
        validatedAt: new Date('2024-03-18'),
        validatedBy: adminUser.id,
      },
    }),
    prisma.timeEntry.upsert({
      where: { id: 5 },
      update: {},
      create: {
        userId: staffUsers[1].id,
        projectId: projects[2].id,
        activityId: 15, // Collecte de Données
        semester: 'S1',
        year: 2024,
        hours: 22.0,
        status: 'REJECTED',
        comment: 'Collecte de données sur la pauvreté',
        validatedAt: new Date('2024-03-22'),
        validatedBy: pmsuUser.id,
      },
    }),

    // Entrées pour Staff 3 - S1 2024
    prisma.timeEntry.upsert({
      where: { id: 6 },
      update: {},
      create: {
        userId: staffUsers[2].id,
        projectId: projects[3].id,
        activityId: 18, // Renforcement des Capacités
        semester: 'S1',
        year: 2024,
        hours: 35.0,
        status: 'APPROVED',
        comment: 'Renforcement des capacités institutionnelles',
        validatedAt: new Date('2024-03-25'),
        validatedBy: adminUser.id,
      },
    }),

    // Entrées pour Staff 4 - S1 2024
    prisma.timeEntry.upsert({
      where: { id: 7 },
      update: {},
      create: {
        userId: staffUsers[3].id,
        projectId: projects[0].id,
        activityId: 7, // Coordination
        semester: 'S1',
        year: 2024,
        hours: 30.0,
        status: 'APPROVED',
        comment: 'Coordination du projet développement durable',
        validatedAt: new Date('2024-03-28'),
        validatedBy: pmsuUser.id,
      },
    }),
    prisma.timeEntry.upsert({
      where: { id: 8 },
      update: {},
      create: {
        userId: staffUsers[3].id,
        projectId: projects[5].id,
        activityId: 11, // Innovation Technologique
        semester: 'S1',
        year: 2024,
        hours: 26.5,
        status: 'PENDING',
        comment: 'Développement de solutions innovantes',
      },
    }),

    // Entrées pour Staff 5 - S1 2024
    prisma.timeEntry.upsert({
      where: { id: 9 },
      update: {},
      create: {
        userId: staffUsers[4].id,
        projectId: projects[2].id,
        activityId: 16, // Analyse d'Impact
        semester: 'S1',
        year: 2024,
        hours: 24.0,
        status: 'APPROVED',
        comment: 'Analyse d\'impact du programme de réduction de la pauvreté',
        validatedAt: new Date('2024-03-30'),
        validatedBy: adminUser.id,
      },
    }),

    // Entrées pour S2 2024
    prisma.timeEntry.upsert({
      where: { id: 10 },
      update: {},
      create: {
        userId: staffUsers[0].id,
        projectId: projects[0].id,
        activityId: 8, // Suivi et Reporting
        semester: 'S2',
        year: 2024,
        hours: 20.0,
        status: 'PENDING',
        comment: 'Reporting semestriel',
      },
    }),
    prisma.timeEntry.upsert({
      where: { id: 11 },
      update: {},
      create: {
        userId: staffUsers[1].id,
        projectId: projects[1].id,
        activityId: 9, // Analyse de Données
        semester: 'S2',
        year: 2024,
        hours: 15.5,
        status: 'APPROVED',
        comment: 'Analyse des résultats climatiques',
        validatedAt: new Date('2024-09-15'),
        validatedBy: pmsuUser.id,
      },
    }),

    // Entrées pour S1 2025
    prisma.timeEntry.upsert({
      where: { id: 12 },
      update: {},
      create: {
        userId: staffUsers[0].id,
        projectId: projects[0].id,
        activityId: 6, // Planification
        semester: 'S1',
        year: 2025,
        hours: 18.0,
        status: 'PENDING',
        comment: 'Planification 2025',
      },
    }),
    prisma.timeEntry.upsert({
      where: { id: 13 },
      update: {},
      create: {
        userId: staffUsers[2].id,
        projectId: projects[4].id,
        activityId: 19, // Appui Technique
        semester: 'S1',
        year: 2025,
        hours: 12.0,
        status: 'APPROVED',
        comment: 'Appui technique en gestion des risques',
        validatedAt: new Date('2025-03-10'),
        validatedBy: managementUser.id,
      },
    }),
  ]);

  // ========================================
  // CRÉATION DE L'HISTORIQUE DE VALIDATION
  // ========================================
  console.log('📋 Création de l\'historique de validation...');

  const validationHistory = await Promise.all([
    // Historique pour l'entrée rejetée (Staff 2)
    prisma.timeEntryValidation.upsert({
      where: { id: 1 },
      update: {},
      create: {
        timeEntryId: 5, // Entrée rejetée de Staff 2
        status: 'REJECTED',
        comment: 'Données incomplètes, veuillez fournir plus de détails',
        validatedBy: pmsuUser.id,
      },
    }),
    prisma.timeEntryValidation.upsert({
      where: { id: 2 },
      update: {},
      create: {
        timeEntryId: 5, // Même entrée, révisée
        status: 'REVISED',
        comment: 'Entrée révisée avec les données complémentaires',
        validatedBy: pmsuUser.id,
      },
    }),
    prisma.timeEntryValidation.upsert({
      where: { id: 3 },
      update: {},
      create: {
        timeEntryId: 5, // Même entrée, approuvée après révision
        status: 'APPROVED',
        comment: 'Approuvé après révision',
        validatedBy: pmsuUser.id,
      },
    }),

    // Historique pour une autre entrée
    prisma.timeEntryValidation.upsert({
      where: { id: 4 },
      update: {},
      create: {
        timeEntryId: 3, // Entrée en attente de Staff 1
        status: 'PENDING',
        comment: 'En attente de validation',
        validatedBy: adminUser.id,
      },
    }),
  ]);

  console.log('✅ Seeding terminé avec succès !');
  console.log(`📊 Résumé :
  - ${staffUsers.length + 3} utilisateurs créés (Admin, PMSU, Management, ${staffUsers.length} Staff)
  - ${projects.length} projets créés
  - ${activities.length} activités créées
  - ${timeEntries.length} entrées de temps créées
  - ${validationHistory.length} validations dans l'historique
  - ${proformaCosts.length} coûts proforma définis`);

  console.log('\n🔑 Comptes de test :');
  console.log('Admin: admin@undp.org / Admin@123');
  console.log('PMSU: pmsu@undp.org / Pmsu@123');
  console.log('Management: management@undp.org / Management@123');
  console.log('Staff: staff1@undp.org à staff5@undp.org / Staff@123');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
