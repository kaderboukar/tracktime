const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTimePeriodTable() {
  try {
    console.log('🔧 Création de la table TimePeriod...');
    
    // Créer la table TimePeriod directement avec une requête SQL
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS TimePeriod (
        id INT NOT NULL AUTO_INCREMENT,
        year INT NOT NULL,
        semester ENUM('S1', 'S2') NOT NULL,
        isActive BOOLEAN NOT NULL DEFAULT false,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY TimePeriod_year_semester_key (year, semester),
        INDEX TimePeriod_isActive_idx (isActive)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `;
    
    console.log('✅ Table TimePeriod créée avec succès !');
    
    // Créer une période active pour l'année en cours
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const currentSemester = currentMonth < 6 ? 'S1' : 'S2';
    
    console.log(`📅 Création d'une période active pour ${currentYear} - ${currentSemester}...`);
    
    const newPeriod = await prisma.timePeriod.create({
      data: {
        year: currentYear,
        semester: currentSemester,
        isActive: true
      }
    });
    
    console.log('✅ Période active créée:', newPeriod);
    
    // Vérifier que la période est bien créée
    const activePeriod = await prisma.timePeriod.findFirst({
      where: { isActive: true }
    });
    
    if (activePeriod) {
      console.log('✅ Période active confirmée:', activePeriod);
    } else {
      console.log('❌ Aucune période active trouvée');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de la table TimePeriod:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTimePeriodTable();
