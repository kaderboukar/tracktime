const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPDFGenerator() {
  try {
    console.log('🧪 Test du générateur PDF personnalisé...');
    
    // Données de test
    const testData = {
      userName: "John Doe",
      userGrade: "P4",
      userProformaCost: 50000,
      totalHours: 160,
      totalCalculatedCost: 8333.33,
      year: 2024,
      semester: "S1",
      timeEntries: [
        {
          projectName: "Projet Test 1",
          activityName: "Développement",
          hours: 80,
          cost: 4166.67
        },
        {
          projectName: "Projet Test 2",
          activityName: "Support",
          hours: 80,
          cost: 4166.67
        }
      ],
      signatureInfo: {
        signedBy: "John Doe",
        signedAt: new Date(),
        signatureToken: "test_token_123"
      }
    };
    
    console.log('📊 Données de test:', testData);
    
    // Importer et tester le générateur
    console.log('🔄 Import du générateur...');
    const { generateTimesheetPDFWithPDFMaker } = require('../src/lib/pdf-maker-generator.ts');
    
    console.log('🎨 Génération du PDF...');
    const pdfBuffer = await generateTimesheetPDFWithPDFMaker(testData);
    
    console.log('✅ PDF généré avec succès!');
    console.log('📏 Taille du PDF:', pdfBuffer.length, 'bytes');
    console.log('🔍 Type du buffer:', typeof pdfBuffer);
    console.log('📋 Buffer est Uint8Array:', pdfBuffer instanceof Uint8Array);
    
    // Vérifier que c'est bien un PDF
    const pdfHeader = pdfBuffer.slice(0, 4).toString();
    console.log('📄 En-tête PDF:', pdfHeader);
    console.log('✅ Est-ce un PDF valide?', pdfHeader === '%PDF');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération du PDF:', error);
    console.error('Stack trace:', error.stack);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le test
if (require.main === module) {
  testPDFGenerator()
    .then(success => {
      if (success) {
        console.log('🎉 Test réussi!');
        process.exit(0);
      } else {
        console.log('💥 Test échoué!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { testPDFGenerator };
