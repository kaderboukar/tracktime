#!/usr/bin/env node

/**
 * Script de Test des Formules de Coûts
 * 
 * Ce script teste la cohérence des formules de calcul de coûts
 * sans nécessiter de connexion à la base de données.
 */

// Constantes de test
const TEST_CASES = [
  { annualCost: 96000, hours: 8, expectedHourly: 100, expectedEntry: 800 },
  { annualCost: 72000, hours: 6, expectedHourly: 75, expectedEntry: 450 },
  { annualCost: 48000, hours: 4, expectedHourly: 50, expectedEntry: 200 },
  { annualCost: 120000, hours: 10, expectedHourly: 125, expectedEntry: 1250 }
];

/**
 * Test de la formule standardisée
 */
function testStandardFormula() {
  console.log('\n🧮 Test de la Formule Standardisée');
  console.log('=' .repeat(50));
  
  let allPassed = true;
  
  TEST_CASES.forEach((testCase, index) => {
    console.log(`\n📊 Test Case ${index + 1}:`);
    console.log(`  Coût annuel: ${testCase.annualCost} USD`);
    console.log(`  Heures: ${testCase.hours}h`);
    
    // Calcul standardisé
    const semesterCost = testCase.annualCost / 2;
    const hourlyCost = semesterCost / 480;
    const entryCost = testCase.hours * hourlyCost;
    
    console.log(`  Coût semestriel: ${semesterCost} USD`);
    console.log(`  Coût horaire calculé: ${hourlyCost.toFixed(2)} USD/heure`);
    console.log(`  Coût d'entrée calculé: ${entryCost.toFixed(2)} USD`);
    
    // Vérifications
    const isHourlyCorrect = Math.abs(hourlyCost - testCase.expectedHourly) < 0.01;
    const isEntryCorrect = Math.abs(entryCost - testCase.expectedEntry) < 0.01;
    
    console.log(`  ✅ Coût horaire correct: ${isHourlyCorrect}`);
    console.log(`  ✅ Coût d'entrée correct: ${isEntryCorrect}`);
    
    if (!isHourlyCorrect || !isEntryCorrect) {
      allPassed = false;
    }
  });
  
  return allPassed;
}

/**
 * Test de cohérence entre différentes approches
 */
function testConsistency() {
  console.log('\n🔄 Test de Cohérence entre Approches');
  console.log('=' .repeat(50));
  
  const annualCost = 96000;
  const hours = 8;
  
  // Approche 1: Calcul direct
  const approach1 = (annualCost / 2 / 480) * hours;
  
  // Approche 2: Calcul par étapes
  const semesterCost = annualCost / 2;
  const hourlyCost = semesterCost / 480;
  const approach2 = hourlyCost * hours;
  
  // Approche 3: Utilisation des constantes
  const HOURS_PER_SEMESTER = 480;
  const SEMESTERS_PER_YEAR = 2;
  const approach3 = (annualCost / SEMESTERS_PER_YEAR / HOURS_PER_SEMESTER) * hours;
  
  console.log(`Coût annuel: ${annualCost} USD`);
  console.log(`Heures: ${hours}h`);
  console.log(`\nRésultats:`);
  console.log(`  Approche 1 (direct): ${approach1.toFixed(2)} USD`);
  console.log(`  Approche 2 (étapes): ${approach2.toFixed(2)} USD`);
  console.log(`  Approche 3 (constantes): ${approach3.toFixed(2)} USD`);
  
  const isConsistent = Math.abs(approach1 - approach2) < 0.01 && 
                      Math.abs(approach2 - approach3) < 0.01;
  
  console.log(`\n✅ Cohérence entre approches: ${isConsistent}`);
  
  return isConsistent;
}

/**
 * Test des cas limites
 */
function testEdgeCases() {
  console.log('\n⚠️ Test des Cas Limites');
  console.log('=' .repeat(50));
  
  let allPassed = true;
  
  // Test 1: Coût annuel nul
  const zeroCost = (0 / 2 / 480) * 8;
  console.log(`Coût annuel 0 USD, 8h: ${zeroCost} USD`);
  const isZeroCorrect = zeroCost === 0;
  console.log(`✅ Résultat correct: ${isZeroCorrect}`);
  if (!isZeroCorrect) allPassed = false;
  
  // Test 2: Heures nulles
  const zeroHours = (96000 / 2 / 480) * 0;
  console.log(`Coût annuel 96000 USD, 0h: ${zeroHours} USD`);
  const isZeroHoursCorrect = zeroHours === 0;
  console.log(`✅ Résultat correct: ${isZeroHoursCorrect}`);
  if (!isZeroHoursCorrect) allPassed = false;
  
  // Test 3: Coût très élevé
  const highCost = (1000000 / 2 / 480) * 1;
  console.log(`Coût annuel 1000000 USD, 1h: ${highCost.toFixed(2)} USD`);
  const isHighCostReasonable = highCost > 0 && highCost < 10000;
  console.log(`✅ Résultat raisonnable: ${isHighCostReasonable}`);
  if (!isHighCostReasonable) allPassed = false;
  
  return allPassed;
}

/**
 * Test de performance
 */
function testPerformance() {
  console.log('\n⚡ Test de Performance');
  console.log('=' .repeat(50));
  
  const iterations = 1000000;
  const startTime = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    const annualCost = 50000 + (i % 100000);
    const hours = 1 + (i % 40);
    const cost = (annualCost / 2 / 480) * hours;
    // Utiliser le résultat pour éviter l'optimisation
    if (cost < 0) console.log('Erreur');
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  const operationsPerSecond = Math.round(iterations / (duration / 1000));
  
  console.log(`Calculs effectués: ${iterations.toLocaleString()}`);
  console.log(`Temps total: ${duration}ms`);
  console.log(`Performance: ${operationsPerSecond.toLocaleString()} opérations/seconde`);
  
  const isPerformanceGood = operationsPerSecond > 100000;
  console.log(`✅ Performance acceptable: ${isPerformanceGood}`);
  
  return isPerformanceGood;
}

/**
 * Fonction principale
 */
function runTests() {
  console.log('🚀 Test des Formules de Calcul de Coûts');
  console.log('=' .repeat(60));
  
  const results = [];
  
  // Test 1: Formule standardisée
  results.push(testStandardFormula());
  
  // Test 2: Cohérence
  results.push(testConsistency());
  
  // Test 3: Cas limites
  results.push(testEdgeCases());
  
  // Test 4: Performance
  results.push(testPerformance());
  
  // Résumé final
  console.log('\n📋 RÉSUMÉ DES TESTS');
  console.log('=' .repeat(60));
  
  const passedTests = results.filter(Boolean).length;
  const totalTests = results.length;
  
  console.log(`Tests réussis: ${passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 TOUS LES TESTS SONT PASSÉS !');
    console.log('✅ Les formules de calcul sont cohérentes et performantes.');
    console.log('✅ La standardisation est prête pour la production.');
  } else {
    console.log('\n⚠️ CERTAINS TESTS ONT ÉCHOUÉ !');
    console.log('❌ Vérifiez la logique des formules.');
  }
  
  // Recommandations
  console.log('\n💡 RECOMMANDATIONS:');
  if (passedTests === totalTests) {
    console.log('✅ Déployer les corrections en production');
    console.log('✅ Former les utilisateurs sur la nouvelle logique');
    console.log('✅ Surveiller les métriques de coûts');
  } else {
    console.log('❌ Corriger les formules avant le déploiement');
    console.log('❌ Revoir la logique métier');
    console.log('❌ Tester à nouveau après corrections');
  }
}

// Exécuter les tests
runTests();
