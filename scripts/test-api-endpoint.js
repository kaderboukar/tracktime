const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAPIEndpoint() {
  try {
    console.log('🧪 Test de l\'API endpoint /api/time-entries...');
    
    // 1. Test avec John Doe (userId: 4, 2025 S1)
    console.log('\n📋 Test avec John Doe (userId: 4, 2025 S1):');
    const johnDoeEntries = await prisma.timeEntry.findMany({
      where: {
        userId: 4,
        year: 2025,
        semester: 'S1'
      },
      include: {
        user: true,
        project: true,
        activity: true
      }
    });
    
    console.log(`  - Nombre d'entrées trouvées: ${johnDoeEntries.length}`);
    johnDoeEntries.forEach(entry => {
      console.log(`    * ID: ${entry.id}, Status: ${entry.status || 'PENDING'}, Project: ${entry.project.name}, Activity: ${entry.activity.name}`);
    });
    
    const johnDoeAllApproved = johnDoeEntries.every(entry => entry.status === 'APPROVED');
    console.log(`  - Toutes approuvées? ${johnDoeAllApproved}`);
    
    // 2. Test avec Boubacar (userId: 10, 2025 S1)
    console.log('\n📋 Test avec Boubacar (userId: 10, 2025 S1):');
    const boubacarEntries = await prisma.timeEntry.findMany({
      where: {
        userId: 10,
        year: 2025,
        semester: 'S1'
      },
      include: {
        user: true,
        project: true,
        activity: true
      }
    });
    
    console.log(`  - Nombre d'entrées trouvées: ${boubacarEntries.length}`);
    boubacarEntries.forEach(entry => {
      console.log(`    * ID: ${entry.id}, Status: ${entry.status || 'PENDING'}, Project: ${entry.project.name}, Activity: ${entry.activity.name}`);
    });
    
    const boubacarAllApproved = boubacarEntries.every(entry => entry.status === 'APPROVED');
    console.log(`  - Toutes approuvées? ${boubacarAllApproved}`);
    
    // 3. Test de l'API simulée
    console.log('\n🔗 Test de l\'API simulée:');
    console.log('  - Endpoint: /api/time-entries?userId={userId}&semester={semester}&year={year}');
    console.log('  - Méthode: GET');
    console.log('  - Headers: Authorization: Bearer {token}');
    
    // 4. Résumé des tests
    console.log('\n📊 Résumé des tests:');
    console.log(`  - John Doe (4, 2025 S1): ${johnDoeEntries.length} entrées, Toutes approuvées: ${johnDoeAllApproved}`);
    console.log(`  - Boubacar (10, 2025 S1): ${boubacarEntries.length} entrées, Toutes approuvées: ${boubacarAllApproved}`);
    
    if (johnDoeAllApproved && boubacarAllApproved) {
      console.log('\n🎉 Tous les tests sont positifs! Les boutons "Faire Signer" devraient être visibles.');
    } else {
      console.log('\n⚠️ Certains tests sont négatifs. Vérifiez les statuts des entrées.');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le test
if (require.main === module) {
  testAPIEndpoint()
    .then(success => {
      if (success) {
        console.log('\n🎯 Test terminé avec succès!');
        process.exit(0);
      } else {
        console.log('\n💥 Test échoué!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { testAPIEndpoint };
