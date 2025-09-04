const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugApprovalStatus() {
  try {
    console.log('🔍 Débogage du statut d\'approbation...');
    
    // 1. Vérifier toutes les entrées avec leurs statuts
    console.log('\n📊 Toutes les entrées de temps:');
    const allEntries = await prisma.timeEntry.findMany({
      take: 20,
      include: {
        user: true,
        project: true,
        activity: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    allEntries.forEach(entry => {
      console.log(`  - ID: ${entry.id}, User: ${entry.user.name} (${entry.userId}), Status: ${entry.status || 'PENDING'}, Semester: ${entry.semester}, Year: ${entry.year}`);
    });
    
    // 2. Vérifier les entrées approuvées
    console.log('\n✅ Entrées approuvées:');
    const approvedEntries = await prisma.timeEntry.findMany({
      where: {
        status: 'APPROVED'
      },
      include: {
        user: true
      }
    });
    
    approvedEntries.forEach(entry => {
      console.log(`  - ID: ${entry.id}, User: ${entry.user.name} (${entry.userId}), Semester: ${entry.semester}, Year: ${entry.year}`);
    });
    
    // 3. Vérifier les entrées en attente
    console.log('\n⏳ Entrées en attente:');
    const pendingEntries = await prisma.timeEntry.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        user: true
      }
    });
    
    pendingEntries.forEach(entry => {
      console.log(`  - ID: ${entry.id}, User: ${entry.user.name} (${entry.userId}), Semester: ${entry.semester}, Year: ${entry.year}`);
    });
    
    // 4. Test de la logique de filtrage
    console.log('\n🧮 Test de la logique de filtrage:');
    
    // Test avec John Doe (userId: 4)
    const johnDoeEntries = await prisma.timeEntry.findMany({
      where: {
        userId: 4,
        year: 2025,
        semester: 'S1'
      }
    });
    
    console.log(`\n📋 Entrées de John Doe (2025 S1): ${johnDoeEntries.length}`);
    johnDoeEntries.forEach(entry => {
      console.log(`  - ID: ${entry.id}, Status: ${entry.status || 'PENDING'}`);
    });
    
    const johnDoeAllApproved = johnDoeEntries.every(entry => entry.status === 'APPROVED');
    console.log(`✅ John Doe - Toutes approuvées? ${johnDoeAllApproved}`);
    
    // Test avec Boubacar (userId: 10)
    const boubacarEntries = await prisma.timeEntry.findMany({
      where: {
        userId: 10,
        year: 2025,
        semester: 'S1'
      }
    });
    
    console.log(`\n📋 Entrées de Boubacar (2025 S1): ${boubacarEntries.length}`);
    boubacarEntries.forEach(entry => {
      console.log(`  - ID: ${entry.id}, Status: ${entry.status || 'PENDING'}`);
    });
    
    const boubacarAllApproved = boubacarEntries.every(entry => entry.status === 'APPROVED');
    console.log(`✅ Boubacar - Toutes approuvées? ${boubacarAllApproved}`);
    
    // 5. Vérifier la structure de la base de données
    console.log('\n🗄️ Structure de la base de données:');
    console.log('  - Table TimeEntry existe');
    console.log('  - Champ status peut être: APPROVED, REJECTED, REVISED, PENDING, ou NULL');
    console.log('  - Champ status est optionnel (peut être NULL)');
    
    // 6. Vérifier les valeurs NULL
    console.log('\n🔍 Entrées avec status NULL:');
    const nullStatusEntries = await prisma.timeEntry.findMany({
      where: {
        status: null
      },
      include: {
        user: true
      }
    });
    
    if (nullStatusEntries.length > 0) {
      nullStatusEntries.forEach(entry => {
        console.log(`  - ID: ${entry.id}, User: ${entry.user.name} (${entry.userId}), Status: NULL, Semester: ${entry.semester}, Year: ${entry.year}`);
      });
    } else {
      console.log('  - Aucune entrée avec status NULL');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur lors du débogage:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le débogage
if (require.main === module) {
  debugApprovalStatus()
    .then(success => {
      if (success) {
        console.log('\n🎯 Débogage terminé. Vérifiez les résultats ci-dessus.');
        process.exit(0);
      } else {
        console.log('\n💥 Débogage échoué!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { debugApprovalStatus };
