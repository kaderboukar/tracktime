const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAPIResponse() {
  try {
    console.log('🧪 Test de la réponse de l\'API time-entries...');
    
    // Simuler l'appel API avec les paramètres
    console.log('\n📋 Test avec John Doe (userId: 4, 2025 S1):');
    
    const johnDoeEntries = await prisma.timeEntry.findMany({
      where: {
        userId: 4,
        year: 2025,
        semester: 'S1'
      },
      include: {
        user: {
          select: {
            name: true,
            indice: true,
            grade: true,
            proformaCosts: {
              select: {
                year: true,
                cost: true
              }
            },
          },
        },
        project: {
          select: {
            name: true,
            projectNumber: true,
          },
        },
        activity: {
          select: {
            name: true,
          },
        },
        validationHistory: {
          include: {
            validator: {
              select: {
                name: true,
                indice: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });
    
    console.log(`  - Nombre d'entrées trouvées: ${johnDoeEntries.length}`);
    
    // Simuler la réponse de l'API
    const apiResponse = {
      success: true,
      data: johnDoeEntries
    };
    
    console.log('\n📡 Réponse simulée de l\'API:');
    console.log('  - success:', apiResponse.success);
    console.log('  - data.length:', apiResponse.data.length);
    
    // Vérifier la logique du composant
    if (apiResponse.success && Array.isArray(apiResponse.data)) {
      const userEntries = apiResponse.data;
      console.log(`  - Entrées trouvées: ${userEntries.length}`);
      
      if (userEntries.length === 0) {
        console.log('  - ❌ Aucune entrée trouvée');
      } else {
        const allApproved = userEntries.every(entry => entry.status === 'APPROVED');
        console.log(`  - ✅ Toutes approuvées? ${allApproved}`);
        
        // Afficher les détails
        userEntries.forEach(entry => {
          console.log(`    * ID: ${entry.id}, Status: ${entry.status || 'PENDING'}, Project: ${entry.project.name}, Activity: ${entry.activity.name}`);
        });
      }
    } else {
      console.log('  - ❌ Format de données invalide');
    }
    
    // Test avec Boubacar
    console.log('\n📋 Test avec Boubacar (userId: 10, 2025 S1):');
    
    const boubacarEntries = await prisma.timeEntry.findMany({
      where: {
        userId: 10,
        year: 2025,
        semester: 'S1'
      },
      include: {
        user: {
          select: {
            name: true,
            indice: true,
            grade: true,
            proformaCosts: {
              select: {
                year: true,
                cost: true
              }
            },
          },
        },
        project: {
          select: {
            name: true,
            projectNumber: true,
          },
        },
        activity: {
          select: {
            name: true,
          },
        },
        validationHistory: {
          include: {
            validator: {
              select: {
                name: true,
                indice: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });
    
    const boubacarApiResponse = {
      success: true,
      data: boubacarEntries
    };
    
    if (boubacarApiResponse.success && Array.isArray(boubacarApiResponse.data)) {
      const userEntries = boubacarApiResponse.data;
      console.log(`  - Entrées trouvées: ${userEntries.length}`);
      
      if (userEntries.length === 0) {
        console.log('  - ❌ Aucune entrée trouvée');
      } else {
        const allApproved = userEntries.every(entry => entry.status === 'APPROVED');
        console.log(`  - ✅ Toutes approuvées? ${allApproved}`);
      }
    }
    
    console.log('\n🎯 Résumé:');
    console.log('  - John Doe: Toutes approuvées?', johnDoeEntries.every(entry => entry.status === 'APPROVED'));
    console.log('  - Boubacar: Toutes approuvées?', boubacarEntries.every(entry => entry.status === 'APPROVED'));
    
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
  testAPIResponse()
    .then(success => {
      if (success) {
        console.log('\n🎉 Test terminé avec succès!');
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

module.exports = { testAPIResponse };
