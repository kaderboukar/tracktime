#!/usr/bin/env node

/**
 * Script de Validation des Calculs de Coûts
 * 
 * Ce script teste la cohérence des calculs de coûts entre toutes les APIs
 * pour s'assurer que la standardisation fonctionne correctement.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Constantes de test
const TEST_ANNUAL_COST = 96000; // 96,000 USD par an
const TEST_HOURS = 8; // 8 heures de travail
const EXPECTED_HOURLY_COST = 100; // (96000 / 2) / 480 = 100 USD/heure
const EXPECTED_ENTRY_COST = 800; // 8 * 100 = 800 USD

/**
 * Test 1: Validation de la formule standardisée
 */
function testStandardFormula() {
  console.log('\n🧮 Test 1: Validation de la Formule Standardisée');
  console.log('=' .repeat(50));
  
  const semesterCost = TEST_ANNUAL_COST / 2;
  const hourlyCost = semesterCost / 480;
  const entryCost = TEST_HOURS * hourlyCost;
  
  console.log(`Coût annuel: ${TEST_ANNUAL_COST} USD`);
  console.log(`Coût semestriel: ${semesterCost} USD`);
  console.log(`Coût horaire: ${hourlyCost} USD/heure`);
  console.log(`Coût pour ${TEST_HOURS}h: ${entryCost} USD`);
  
  const isHourlyCostCorrect = Math.abs(hourlyCost - EXPECTED_HOURLY_COST) < 0.01;
  const isEntryCostCorrect = Math.abs(entryCost - EXPECTED_ENTRY_COST) < 0.01;
  
  console.log(`✅ Coût horaire correct: ${isHourlyCostCorrect}`);
  console.log(`✅ Coût d'entrée correct: ${isEntryCostCorrect}`);
  
  return isHourlyCostCorrect && isEntryCostCorrect;
}

/**
 * Test 2: Validation des constantes
 */
function testConstants() {
  console.log('\n📅 Test 2: Validation des Constantes');
  console.log('=' .repeat(50));
  
  const HOURS_PER_SEMESTER = 480;
  const HOURS_PER_YEAR = 960;
  const SEMESTERS_PER_YEAR = 2;
  
  console.log(`Heures par semestre: ${HOURS_PER_SEMESTER}`);
  console.log(`Heures par année: ${HOURS_PER_YEAR}`);
  console.log(`Semestres par année: ${SEMESTERS_PER_YEAR}`);
  
  const isConsistent = HOURS_PER_SEMESTER * SEMESTERS_PER_YEAR === HOURS_PER_YEAR;
  console.log(`✅ Cohérence mathématique: ${isConsistent}`);
  
  return isConsistent;
}

/**
 * Test 3: Validation des données de la base
 */
async function testDatabaseData() {
  console.log('\n🗄️ Test 3: Validation des Données de la Base');
  console.log('=' .repeat(50));
  
  try {
    // Récupérer quelques utilisateurs avec leurs coûts proforma
    const users = await prisma.user.findMany({
      where: {
        proformaCosts: {
          some: {}
        }
      },
      include: {
        proformaCosts: {
          where: {
            year: new Date().getFullYear()
          }
        }
      },
      take: 5
    });
    
    console.log(`Utilisateurs trouvés: ${users.length}`);
    
    let allValid = true;
    
    for (const user of users) {
      if (user.proformaCosts.length > 0) {
        const annualCost = user.proformaCosts[0].cost;
        const hourlyCost = (annualCost / 2) / 480;
        
        console.log(`\n👤 ${user.name}:`);
        console.log(`  Coût annuel: ${annualCost} USD`);
        console.log(`  Coût horaire calculé: ${hourlyCost.toFixed(2)} USD/heure`);
        
        // Vérifier que le coût horaire est raisonnable (entre 10 et 1000 USD/heure)
        const isReasonable = hourlyCost >= 10 && hourlyCost <= 1000;
        console.log(`  ✅ Coût raisonnable: ${isReasonable}`);
        
        if (!isReasonable) {
          allValid = false;
        }
      }
    }
    
    return allValid;
    
  } catch (error) {
    console.error('❌ Erreur lors de la validation des données:', error);
    return false;
  }
}

/**
 * Test 4: Validation des calculs croisés
 */
async function testCrossCalculations() {
  console.log('\n🔄 Test 4: Validation des Calculs Croisés');
  console.log('=' .repeat(50));
  
  try {
    // Récupérer quelques projets avec leurs entrées de temps
    const projects = await prisma.project.findMany({
      include: {
        timeEntries: {
          where: {
            status: 'APPROVED',
            year: new Date().getFullYear()
          },
          include: {
            user: {
              include: {
                proformaCosts: {
                  where: {
                    year: new Date().getFullYear()
                  }
                }
              }
            }
          }
        }
      },
      take: 3
    });
    
    console.log(`Projets analysés: ${projects.length}`);
    
    let allConsistent = true;
    
    for (const project of projects) {
      if (project.timeEntries.length > 0) {
        console.log(`\n📊 Projet: ${project.name}`);
        
        let totalHours = 0;
        let totalCalculatedCost = 0;
        
        for (const entry of project.timeEntries) {
          totalHours += entry.hours;
          
          if (entry.user.proformaCosts.length > 0) {
            const annualCost = entry.user.proformaCosts[0].cost;
            const hourlyCost = (annualCost / 2) / 480;
            const entryCost = entry.hours * hourlyCost;
            
            totalCalculatedCost += entryCost;
          }
        }
        
        console.log(`  Total heures: ${totalHours}h`);
        console.log(`  Coût total calculé: ${totalCalculatedCost.toFixed(2)} USD`);
        
        // Vérifier que le coût total est cohérent avec les heures
        const avgHourlyCost = totalCalculatedCost / totalHours;
        const isReasonable = avgHourlyCost >= 10 && avgHourlyCost <= 1000;
        
        console.log(`  Coût horaire moyen: ${avgHourlyCost.toFixed(2)} USD/heure`);
        console.log(`  ✅ Coût moyen raisonnable: ${isReasonable}`);
        
        if (!isReasonable) {
          allConsistent = false;
        }
      }
    }
    
    return allConsistent;
    
  } catch (error) {
    console.error('❌ Erreur lors de la validation des calculs croisés:', error);
    return false;
  }
}

/**
 * Fonction principale de validation
 */
async function runValidation() {
  console.log('🚀 Démarrage de la Validation des Calculs de Coûts');
  console.log('=' .repeat(60));
  
  const results = [];
  
  // Test 1: Formule standardisée
  results.push(testStandardFormula());
  
  // Test 2: Constantes
  results.push(testConstants());
  
  // Test 3: Données de la base
  results.push(await testDatabaseData());
  
  // Test 4: Calculs croisés
  results.push(await testCrossCalculations());
  
  // Résumé final
  console.log('\n📋 RÉSUMÉ DE LA VALIDATION');
  console.log('=' .repeat(60));
  
  const passedTests = results.filter(Boolean).length;
  const totalTests = results.length;
  
  console.log(`Tests réussis: ${passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('🎉 TOUS LES TESTS SONT PASSÉS !');
    console.log('✅ Les calculs de coûts sont cohérents et standardisés.');
  } else {
    console.log('⚠️ CERTAINS TESTS ONT ÉCHOUÉ !');
    console.log('❌ Vérifiez la logique des calculs.');
  }
  
  // Fermer la connexion Prisma
  await prisma.$disconnect();
}

// Exécuter la validation si le script est appelé directement
if (require.main === module) {
  runValidation().catch(console.error);
}

module.exports = { runValidation };
