const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addYearSemesterColumns() {
  try {
    console.log('🔧 Ajout des colonnes year et semester à la table TimeEntry...');
    
    // Ajouter les colonnes year et semester à la table TimeEntry
    await prisma.$executeRaw`
      ALTER TABLE TimeEntry 
      ADD COLUMN year INT NOT NULL DEFAULT 2025
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE TimeEntry 
      ADD COLUMN semester ENUM('S1', 'S2') NOT NULL DEFAULT 'S1'
    `;
    
    console.log('✅ Colonnes year et semester ajoutées avec succès !');
    
    // Vérifier que les colonnes existent
    const tableInfo = await prisma.$queryRaw`
      DESCRIBE TimeEntry
    `;
    
    console.log('📋 Structure de la table TimeEntry:');
    console.log(tableInfo);
    
    // Mettre à jour les entrées existantes avec des valeurs par défaut
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const currentSemester = currentMonth < 6 ? 'S1' : 'S2';
    
    await prisma.$executeRaw`
      UPDATE TimeEntry 
      SET year = ${currentYear}, semester = ${currentSemester}
      WHERE year = 2025 OR year IS NULL
    `;
    
    console.log(`✅ Entrées existantes mises à jour avec ${currentYear}-${currentSemester}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des colonnes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addYearSemesterColumns();
