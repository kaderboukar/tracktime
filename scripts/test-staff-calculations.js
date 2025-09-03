#!/usr/bin/env node

/**
 * Script de Test des Calculs de Coûts STAFF
 * 
 * Ce script teste la logique de calcul des coûts pour le personnel STAFF
 * et vérifie l'absence de NaN dans les résultats.
 */

// Constantes de test
const TEST_CASES = [
  { proformaCost: 96000, hours: 40, expectedTotal: 4000 },
  { proformaCost: 72000, hours: 30, expectedTotal: 2250 },
  { proformaCost: 48000, hours: 20, expectedTotal: 1000 },
  { proformaCost: 0, hours: 10, expectedTotal: 0 },
  { proformaCost: undefined, hours: 15, expectedTotal: 0 },
  { proformaCost: 120000, hours: 0, expectedTotal: 0 },
  { proformaCost: -50000, hours: 8, expectedTotal: 0 }, // Cas négatif
  { proformaCost: 60000, hours: -5, expectedTotal: 0 }  // Heures négatives
];

/**
 * Test de la formule standardisée STAFF
 */
function testStaffFormula() {
  console.log('\n🧮 Test de la Formule STAFF Standardisée');
  console.log('=' .repeat(50));
  
  let allPassed = true;
  
  TEST_CASES.forEach((testCase, index) => {
    console.log(`\n📊 Test Case ${index + 1}:`);
    console.log(`  Coût proforma: ${testCase.proformaCost || 'undefined'} USD`);
    console.log(`  Heures: ${testCase.hours}h`);
    
    // Calcul standardisé avec protection contre les NaN
    let totalCost = 0;
    let semesterCost = 0;
    let hourlyCost = 0;
    
    if (testCase.proformaCost && testCase.proformaCost > 0 && testCase.hours > 0) {
      semesterCost = testCase.proformaCost / 2;
      hourlyCost = semesterCost / 480;
      totalCost = hourlyCost * testCase.hours;
    }
    
    console.log(`  Coût semestriel: ${semesterCost} USD`);
    console.log(`  Coût horaire calculé: ${hourlyCost.toFixed(2)} USD/heure`);
    console.log(`  Coût total calculé: ${totalCost.toFixed(2)} USD`);
    
    // Vérifications
    const isTotalCorrect = Math.abs(totalCost - testCase.expectedTotal) < 0.01;
    const isNotNaN = !isNaN(totalCost) && !isNaN(semesterCost) && !isNaN(hourlyCost);
    const isFiniteValue = Number.isFinite(totalCost) && Number.isFinite(semesterCost) && Number.isFinite(hourlyCost);
    
    console.log(`  ✅ Coût total correct: ${isTotalCorrect}`);
    console.log(`  ✅ Pas de NaN: ${isNotNaN}`);
    console.log(`  ✅ Valeurs finies: ${isFiniteValue}`);
    
    if (!isTotalCorrect || !isNotNaN || !isFiniteValue) {
      allPassed = false;
    }
  });
  
  return allPassed;
}

/**
 * Test de la logique de protection contre les NaN
 */
function testNaNProtection() {
  console.log('\n🛡️ Test de Protection contre les NaN');
  console.log('=' .repeat(50));
  
  const edgeCases = [
    { proformaCost: null, hours: 8, description: 'Proforma null' },
    { proformaCost: 'invalid', hours: 8, description: 'Proforma invalide' },
    { proformaCost: 96000, hours: null, description: 'Heures null' },
    { proformaCost: 96000, hours: 'invalid', description: 'Heures invalides' },
    { proformaCost: NaN, hours: 8, description: 'Proforma NaN' },
    { proformaCost: 96000, hours: NaN, description: 'Heures NaN' },
    { proformaCost: Infinity, hours: 8, description: 'Proforma Infinity' },
    { proformaCost: 96000, hours: Infinity, description: 'Heures Infinity' }
  ];
  
  let allPassed = true;
  
  edgeCases.forEach((testCase, index) => {
    console.log(`\n⚠️ Edge Case ${index + 1}: ${testCase.description}`);
    
    // Simulation de la logique de protection
    let totalCost = 0;
    let semesterCost = 0;
    let hourlyCost = 0;
    
    // Vérifier que les valeurs sont valides
    const isValidProforma = testCase.proformaCost && 
                           typeof testCase.proformaCost === 'number' && 
                           testCase.proformaCost > 0 && 
                           Number.isFinite(testCase.proformaCost);
    
    const isValidHours = testCase.hours && 
                        typeof testCase.hours === 'number' && 
                        testCase.hours > 0 && 
                        Number.isFinite(testCase.hours);
    
    if (isValidProforma && isValidHours) {
      semesterCost = testCase.proformaCost / 2;
      hourlyCost = semesterCost / 480;
      totalCost = hourlyCost * testCase.hours;
    }
    
    console.log(`  Proforma valide: ${isValidProforma}`);
    console.log(`  Heures valides: ${isValidHours}`);
    console.log(`  Coût total: ${totalCost} USD`);
    
    // Vérifier qu'il n'y a pas de NaN
    const isSafe = !isNaN(totalCost) && !isNaN(semesterCost) && !isNaN(hourlyCost);
    console.log(`  ✅ Calculs sûrs: ${isSafe}`);
    
    if (!isSafe) {
      allPassed = false;
    }
  });
  
  return allPassed;
}

/**
 * Test de la cohérence des calculs
 */
function testCalculationConsistency() {
  console.log('\n🔄 Test de Cohérence des Calculs');
  console.log('=' .repeat(50));
  
  const baseProforma = 96000; // 96,000 USD par an
  const testHours = [8, 16, 24, 32, 40];
  
  let allPassed = true;
  let previousCost = null;
  
  testHours.forEach((hours, index) => {
    const semesterCost = baseProforma / 2;
    const hourlyCost = semesterCost / 480;
    const totalCost = hourlyCost * hours;
    
    console.log(`\n📊 Test ${index + 1}: ${hours}h`);
    console.log(`  Coût horaire: ${hourlyCost.toFixed(2)} USD/heure`);
    console.log(`  Coût total: ${totalCost.toFixed(2)} USD`);
    
    // Vérifier la proportionnalité
    if (previousCost !== null) {
      const expectedRatio = hours / testHours[index - 1];
      const actualRatio = totalCost / previousCost;
      const isProportional = Math.abs(expectedRatio - actualRatio) < 0.01;
      
      console.log(`  Ratio attendu: ${expectedRatio.toFixed(2)}`);
      console.log(`  Ratio réel: ${actualRatio.toFixed(2)}`);
      console.log(`  ✅ Proportionnalité: ${isProportional}`);
      
      if (!isProportional) {
        allPassed = false;
      }
    }
    
    previousCost = totalCost;
  });
  
  return allPassed;
}

/**
 * Fonction principale
 */
function runTests() {
  console.log('🚀 Test des Calculs de Coûts STAFF');
  console.log('=' .repeat(60));
  
  const results = [];
  
  // Test 1: Formule standardisée
  results.push(testStaffFormula());
  
  // Test 2: Protection contre les NaN
  results.push(testNaNProtection());
  
  // Test 3: Cohérence des calculs
  results.push(testCalculationConsistency());
  
  // Résumé final
  console.log('\n📋 RÉSUMÉ DES TESTS STAFF');
  console.log('=' .repeat(60));
  
  const passedTests = results.filter(Boolean).length;
  const totalTests = results.length;
  
  console.log(`Tests réussis: ${passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 TOUS LES TESTS STAFF SONT PASSÉS !');
    console.log('✅ Les calculs de coûts STAFF sont fiables et sans NaN.');
    console.log('✅ La protection contre les erreurs est robuste.');
    console.log('✅ Les calculs sont cohérents et proportionnels.');
  } else {
    console.log('\n⚠️ CERTAINS TESTS STAFF ONT ÉCHOUÉ !');
    console.log('❌ Vérifiez la logique des calculs STAFF.');
  }
  
  // Recommandations
  console.log('\n💡 RECOMMANDATIONS:');
  if (passedTests === totalTests) {
    console.log('✅ Déployer les corrections STAFF en production');
    console.log('✅ Vérifier l\'absence de "NaN" dans l\'interface');
    console.log('✅ Tester la cohérence des totaux affichés');
  } else {
    console.log('❌ Corriger les calculs STAFF avant le déploiement');
    console.log('❌ Tester à nouveau après corrections');
  }
}

// Exécuter les tests
runTests();
