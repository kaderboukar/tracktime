const fetch = require('node-fetch');

async function testStaffTimesheetAPI() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Test de l\'API Staff Timesheet avec filtres de période\n');

  try {
    // Test 1: Récupérer toutes les périodes disponibles
    console.log('1️⃣ Test de récupération des périodes disponibles...');
    const periodsResponse = await fetch(`${baseUrl}/api/time-periods`);
    const periodsResult = await periodsResponse.json();
    
    if (periodsResult.success) {
      console.log('✅ Périodes disponibles:', periodsResult.data);
    } else {
      console.log('❌ Erreur lors de la récupération des périodes:', periodsResult.message);
    }

    // Test 2: Récupérer les données staff-timesheet sans filtres
    console.log('\n2️⃣ Test de récupération des données staff-timesheet sans filtres...');
    const staffResponse = await fetch(`${baseUrl}/api/admin/staff-timesheet`);
    const staffResult = await staffResponse.json();
    
    if (staffResult.success) {
      console.log('✅ Données staff-timesheet récupérées:', staffResult.data.length, 'entrées');
      console.log('✅ Périodes disponibles retournées:', staffResult.availablePeriods?.length || 0);
    } else {
      console.log('❌ Erreur lors de la récupération des données staff:', staffResult.message);
    }

    // Test 3: Récupérer les données staff-timesheet avec filtres de période
    if (periodsResult.success && periodsResult.data.length > 0) {
      const testPeriod = periodsResult.data[0];
      console.log(`\n3️⃣ Test de récupération des données staff-timesheet pour ${testPeriod.semester} ${testPeriod.year}...`);
      
      const filteredResponse = await fetch(`${baseUrl}/api/admin/staff-timesheet?year=${testPeriod.year}&semester=${testPeriod.semester}`);
      const filteredResult = await filteredResponse.json();
      
      if (filteredResult.success) {
        console.log('✅ Données filtrées récupérées:', filteredResult.data.length, 'entrées');
        console.log('✅ Périodes disponibles retournées:', filteredResult.availablePeriods?.length || 0);
      } else {
        console.log('❌ Erreur lors de la récupération des données filtrées:', filteredResult.message);
      }
    }

    // Test 4: Test avec une période inexistante
    console.log('\n4️⃣ Test avec une période inexistante (2020 S1)...');
    const invalidResponse = await fetch(`${baseUrl}/api/admin/staff-timesheet?year=2020&semester=S1`);
    const invalidResult = await invalidResponse.json();
    
    if (!invalidResult.success) {
      console.log('✅ Erreur attendue pour période inexistante:', invalidResult.message);
    } else {
      console.log('⚠️  Période inexistante retourne des données (inattendu)');
    }

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }
}

// Exécuter les tests
testStaffTimesheetAPI();

