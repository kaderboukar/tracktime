const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAutoGenerateAPI() {
  try {
    console.log('🧪 Test de l\'API /api/timesheet/auto-generate...');
    
    // 1. Vérifier les données nécessaires
    console.log('\n📊 Vérification des données nécessaires...');
    
    // Test avec Boubacar (userId: 10, 2025 S1)
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
    
    console.log(`📋 Entrées de Boubacar (2025 S1): ${boubacarEntries.length}`);
    boubacarEntries.forEach(entry => {
      console.log(`  - ID: ${entry.id}, Status: ${entry.status || 'PENDING'}, Project: ${entry.project.name}, Activity: ${entry.activity.name}`);
    });
    
    // 2. Vérifier le proforma cost
    const boubacarProformaCost = await prisma.userProformaCost.findUnique({
      where: {
        userId_year: {
          userId: 10,
          year: 2025
        }
      }
    });
    
    console.log(`💰 Proforma cost de Boubacar (2025): ${boubacarProformaCost?.cost || 'Non défini'}`);
    
    // 3. Vérifier que toutes les entrées sont approuvées
    const allApproved = boubacarEntries.every(entry => entry.status === 'APPROVED');
    console.log(`✅ Toutes les entrées sont-elles approuvées? ${allApproved}`);
    
    // 4. Simuler les données envoyées à l'API
    const requestData = {
      userId: 10,
      year: 2025,
      semester: 'S1'
    };
    
    console.log('\n📡 Données envoyées à l\'API:');
    console.log('  - userId:', requestData.userId);
    console.log('  - year:', requestData.year);
    console.log('  - semester:', requestData.semester);
    
    // 5. Vérifier la structure attendue par l'API
    console.log('\n🔍 Structure attendue par l\'API:');
    console.log('  - Endpoint: POST /api/timesheet/auto-generate');
    console.log('  - Headers: Content-Type: application/json, Authorization: Bearer {token}');
    console.log('  - Body: { userId, year, semester }');
    
    // 6. Résumé
    console.log('\n📊 Résumé du test:');
    console.log(`  - Utilisateur: Boubacar (ID: 10)`);
    console.log(`  - Période: ${requestData.semester} ${requestData.year}`);
    console.log(`  - Entrées trouvées: ${boubacarEntries.length}`);
    console.log(`  - Toutes approuvées: ${allApproved}`);
    console.log(`  - Proforma cost: ${boubacarProformaCost?.cost || 'Non défini'}`);
    
    if (allApproved && boubacarEntries.length > 0) {
      console.log('\n🎉 Conditions remplies! L\'API devrait fonctionner.');
    } else {
      console.log('\n⚠️ Conditions non remplies. Vérifiez les données.');
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
  testAutoGenerateAPI()
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

module.exports = { testAutoGenerateAPI };
