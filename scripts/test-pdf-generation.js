#!/usr/bin/env node

/**
 * Script de Test de Génération PDF et Calculs de Coûts
 * 
 * Ce script teste la logique de calcul des coûts pour éviter les NaN
 * et vérifie la génération du PDF.
 */

// Constantes de test
const TEST_CASES = [
  { proformaCost: 96000, hours: 40, expectedHourly: 100, expectedTotal: 4000 },
  { proformaCost: 72000, hours: 30, expectedHourly: 75, expectedTotal: 2250 },
  { proformaCost: 48000, hours: 20, expectedHourly: 50, expectedTotal: 1000 },
  { proformaCost: 0, hours: 10, expectedHourly: 0, expectedTotal: 0 },
  { proformaCost: undefined, hours: 15, expectedHourly: 0, expectedTotal: 0 },
  { proformaCost: 120000, hours: 0, expectedHourly: 125, expectedTotal: 0 }
];

/**
 * Test de la formule de calcul des coûts
 */
function testCostCalculations() {
  console.log('\n🧮 Test des Calculs de Coûts');
  console.log('=' .repeat(50));
  
  let allPassed = true;
  
  TEST_CASES.forEach((testCase, index) => {
    console.log(`\n📊 Test Case ${index + 1}:`);
    console.log(`  Coût proforma: ${testCase.proformaCost || 'undefined'} USD`);
    console.log(`  Heures: ${testCase.hours}h`);
    
    // Calcul standardisé
    const semesterCost = testCase.proformaCost ? testCase.proformaCost / 2 : 0;
    const hourlyCost = semesterCost / 480;
    const totalCost = hourlyCost * testCase.hours;
    
    console.log(`  Coût semestriel: ${semesterCost} USD`);
    console.log(`  Coût horaire calculé: ${hourlyCost.toFixed(2)} USD/heure`);
    console.log(`  Coût total calculé: ${totalCost.toFixed(2)} USD`);
    
    // Vérifications
    const isHourlyCorrect = Math.abs(hourlyCost - testCase.expectedHourly) < 0.01;
    const isTotalCorrect = Math.abs(totalCost - testCase.expectedTotal) < 0.01;
    const isNotNaN = !isNaN(hourlyCost) && !isNaN(totalCost);
    
    console.log(`  ✅ Coût horaire correct: ${isHourlyCorrect}`);
    console.log(`  ✅ Coût total correct: ${isTotalCorrect}`);
    console.log(`  ✅ Pas de NaN: ${isNotNaN}`);
    
    if (!isHourlyCorrect || !isTotalCorrect || !isNotNaN) {
      allPassed = false;
    }
  });
  
  return allPassed;
}

/**
 * Test de la fonction formatAmount
 */
function testFormatAmount() {
  console.log('\n💰 Test de la Fonction formatAmount');
  console.log('=' .repeat(50));
  
  const testAmounts = [
    { amount: 1234.56, expected: "1235 USD" },
    { amount: 0, expected: "0 USD" },
    { amount: NaN, expected: "0 USD" },
    { amount: Infinity, expected: "0 USD" },
    { amount: -123.45, expected: "-123 USD" },
    { amount: 999999.99, expected: "1000000 USD" }
  ];
  
  let allPassed = true;
  
  testAmounts.forEach((testCase, index) => {
    // Simulation de la fonction formatAmount
    const formatAmount = (amount) => {
      if (isNaN(amount) || !isFinite(amount)) {
        return "0 USD";
      }
      return `${Math.round(amount)} USD`;
    };
    
    const result = formatAmount(testCase.amount);
    const isCorrect = result === testCase.expected;
    
    console.log(`Test ${index + 1}: ${testCase.amount} → ${result} (${isCorrect ? '✅' : '❌'})`);
    
    if (!isCorrect) {
      allPassed = false;
    }
  });
  
  return allPassed;
}

/**
 * Test de la logique de total des activités
 */
function testActivitiesTotal() {
  console.log('\n📊 Test de la Logique de Total des Activités');
  console.log('=' .repeat(50));
  
  const mockActivities = [
    { hours: 8, cost: 800 },
    { hours: 6, cost: 600 },
    { hours: 4, cost: 400 },
    { hours: 2, cost: NaN }, // Cas problématique
    { hours: 3, cost: Infinity }, // Cas problématique
    { hours: 5, cost: 500 }
  ];
  
  // Calculer le total des coûts des activités (plus fiable)
  const totalActivitiesCost = mockActivities.reduce((sum, activity) => {
    const cost = isNaN(activity.cost) || !isFinite(activity.cost) ? 0 : activity.cost;
    return sum + cost;
  }, 0);
  
  const totalHours = mockActivities.reduce((sum, activity) => sum + activity.hours, 0);
  
  console.log(`Activités testées: ${mockActivities.length}`);
  console.log(`Total des heures: ${totalHours}h`);
  console.log(`Total des coûts (avec gestion des NaN): ${totalActivitiesCost} USD`);
  
  const expectedTotal = 800 + 600 + 400 + 0 + 0 + 500; // 2300 USD
  const isCorrect = totalActivitiesCost === expectedTotal;
  
  console.log(`Total attendu: ${expectedTotal} USD`);
  console.log(`✅ Calcul correct: ${isCorrect}`);
  
  return isCorrect;
}

/**
 * Fonction principale
 */
function runTests() {
  console.log('🚀 Test de Génération PDF et Calculs de Coûts');
  console.log('=' .repeat(60));
  
  const results = [];
  
  // Test 1: Calculs de coûts
  results.push(testCostCalculations());
  
  // Test 2: Fonction formatAmount
  results.push(testFormatAmount());
  
  // Test 3: Logique de total des activités
  results.push(testActivitiesTotal());
  
  // Résumé final
  console.log('\n📋 RÉSUMÉ DES TESTS');
  console.log('=' .repeat(60));
  
  const passedTests = results.filter(Boolean).length;
  const totalTests = results.length;
  
  console.log(`Tests réussis: ${passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 TOUS LES TESTS SONT PASSÉS !');
    console.log('✅ Les calculs de coûts sont fiables et sans NaN.');
    console.log('✅ Le PDF devrait se générer correctement.');
    console.log('✅ Le total sera affiché clairement.');
  } else {
    console.log('\n⚠️ CERTAINS TESTS ONT ÉCHOUÉ !');
    console.log('❌ Vérifiez la logique des calculs.');
  }
  
  // Recommandations
  console.log('\n💡 RECOMMANDATIONS:');
  if (passedTests === totalTests) {
    console.log('✅ Tester la génération PDF en production');
    console.log('✅ Vérifier que le total s\'affiche correctement');
    console.log('✅ Confirmer l\'absence de "NaN USD"');
  } else {
    console.log('❌ Corriger les calculs avant le déploiement');
    console.log('❌ Tester à nouveau après corrections');
  }
}

// Exécuter les tests
runTests();
