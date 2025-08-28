const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestPeriod() {
  try {
    // Créer une période active pour l'année en cours
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const currentSemester = currentMonth < 6 ? 'S1' : 'S2';

    console.log(`Création d'une période active pour ${currentYear} - ${currentSemester}...`);

    // Désactiver toutes les périodes existantes
    await prisma.timePeriod.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    // Créer la nouvelle période active
    const newPeriod = await prisma.timePeriod.create({
      data: {
        year: currentYear,
        semester: currentSemester,
        isActive: true
      }
    });

    console.log('✅ Période créée avec succès:', {
      id: newPeriod.id,
      year: newPeriod.year,
      semester: newPeriod.semester,
      isActive: newPeriod.isActive
    });

    // Vérifier que la période est bien active
    const activePeriod = await prisma.timePeriod.findFirst({
      where: { isActive: true }
    });

    if (activePeriod) {
      console.log('✅ Période active confirmée:', {
        id: activePeriod.id,
        year: activePeriod.year,
        semester: activePeriod.semester
      });
    } else {
      console.log('❌ Aucune période active trouvée');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la création de la période:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestPeriod();
