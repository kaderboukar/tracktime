const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testTimePeriods() {
  try {
    console.log('🧪 Test de l\'API des périodes de temps...\n');

    // 1. Vérifier la période active actuelle
    console.log('1. Vérification de la période active...');
    const activePeriod = await prisma.timePeriod.findFirst({
      where: { isActive: true }
    });
    
    if (activePeriod) {
      console.log('✅ Période active trouvée:', {
        id: activePeriod.id,
        year: activePeriod.year,
        semester: activePeriod.semester,
        isActive: activePeriod.isActive
      });
    } else {
      console.log('❌ Aucune période active trouvée');
    }

    // 2. Lister toutes les périodes
    console.log('\n2. Liste de toutes les périodes...');
    const allPeriods = await prisma.timePeriod.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    if (allPeriods.length > 0) {
      console.log('✅ Périodes trouvées:');
      allPeriods.forEach(period => {
        console.log(`   - ID: ${period.id}, ${period.year}-${period.semester}, Active: ${period.isActive}`);
      });
    } else {
      console.log('❌ Aucune période trouvée');
    }

    // 3. Créer une nouvelle période de test
    console.log('\n3. Création d\'une nouvelle période de test...');
    const testPeriod = await prisma.timePeriod.create({
      data: {
        year: 2026,
        semester: 'S1',
        isActive: false
      }
    });
    console.log('✅ Nouvelle période créée:', {
      id: testPeriod.id,
      year: testPeriod.year,
      semester: testPeriod.semester,
      isActive: testPeriod.isActive
    });

    // 4. Activer la nouvelle période
    console.log('\n4. Activation de la nouvelle période...');
    await prisma.timePeriod.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });
    
    const updatedPeriod = await prisma.timePeriod.update({
      where: { id: testPeriod.id },
      data: { isActive: true }
    });
    console.log('✅ Période activée:', {
      id: updatedPeriod.id,
      year: updatedPeriod.year,
      semester: updatedPeriod.semester,
      isActive: updatedPeriod.isActive
    });

    // 5. Vérifier la nouvelle période active
    console.log('\n5. Vérification de la nouvelle période active...');
    const newActivePeriod = await prisma.timePeriod.findFirst({
      where: { isActive: true }
    });
    
    if (newActivePeriod) {
      console.log('✅ Nouvelle période active confirmée:', {
        id: newActivePeriod.id,
        year: newActivePeriod.year,
        semester: newActivePeriod.semester,
        isActive: newActivePeriod.isActive
      });
    } else {
      console.log('❌ Aucune période active trouvée après activation');
    }

    console.log('\n🎉 Tests terminés avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTimePeriods();
