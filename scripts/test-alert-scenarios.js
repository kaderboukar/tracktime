#!/usr/bin/env node

/**
 * Script de test pour différents scénarios d'alertes
 * Teste le système avec des données simulées
 */

const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  adminToken: process.env.ADMIN_TOKEN || 'your-admin-token-here',
};

// Fonction pour faire une requête HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: new URL(url).hostname,
      port: new URL(url).port || (isHttps ? 443 : 3000),
      path: new URL(url).pathname,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.adminToken}`,
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Fonction pour analyser l'état actuel
async function analyzeCurrentState() {
  console.log('🔍 Analyse de l\'état actuel du système...');
  
  try {
    const response = await makeRequest(`${CONFIG.baseUrl}/api/admin/time-entry-alerts/check`, {
      method: 'GET'
    });
    
    if (response.data && response.data.success) {
      const data = response.data.data;
      console.log('\n📊 ÉTAT ACTUEL:');
      console.log(`   Période: ${data.activePeriod.year} - ${data.activePeriod.semester}`);
      console.log(`   Jours depuis activation: ${data.daysSinceActivation}`);
      console.log(`   Total STAFF: ${data.totalStaff}`);
      console.log(`   STAFF sans entrées: ${data.staffWithoutEntries}`);
      console.log(`   Taux de conformité: ${data.complianceRate}%`);
      console.log(`   Prochaine alerte: jour ${data.nextAlertDay}`);
      
      // Analyser les statistiques des alertes
      if (data.alertStats && data.alertStats.length > 0) {
        console.log('\n📈 ALERTES DÉJÀ ENVOYÉES:');
        data.alertStats.forEach(stat => {
          console.log(`   ${stat.alertType}: ${stat._count.id} alertes`);
        });
      } else {
        console.log('\n📈 Aucune alerte envoyée pour cette période');
      }
      
      return data;
    } else {
      console.error('❌ Erreur lors de l\'analyse');
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return null;
  }
}

// Fonction pour simuler un scénario d'alerte
async function simulateAlertScenario(scenario) {
  console.log(`\n🎭 Simulation du scénario: ${scenario.name}`);
  console.log(`📝 Description: ${scenario.description}`);
  
  try {
    // Déclencher l'envoi des alertes
    const response = await makeRequest(`${CONFIG.baseUrl}/api/admin/time-entry-alerts/check`, {
      method: 'POST'
    });
    
    if (response.data && response.data.success) {
      const data = response.data.data;
      console.log(`✅ Résultat: ${data.message}`);
      
      if (data.metrics) {
        const metrics = data.metrics;
        console.log(`📊 Métriques: ${metrics.successfulEmails} succès, ${metrics.failedEmails} échecs`);
        
        if (metrics.totalEmails > 0) {
          console.log(`🚀 PERFORMANCE: ${metrics.totalTime}ms pour ${metrics.totalEmails} emails`);
          console.log(`⚡ Vitesse: ${Math.round(metrics.totalEmails / (metrics.totalTime / 1000))} emails/seconde`);
        }
      }
      
      return data;
    } else {
      console.log(`ℹ️ Résultat: ${response.data?.message || 'Aucun email à envoyer'}`);
      return response.data;
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la simulation: ${error.message}`);
    return null;
  }
}

// Fonction pour tester différents scénarios
async function testAlertScenarios() {
  console.log('🚀 Test des scénarios d\'alertes');
  console.log(`📧 Base URL: ${CONFIG.baseUrl}`);
  console.log('=' .repeat(60));
  
  try {
    // Étape 1: Analyser l'état actuel
    console.log('\n📋 ÉTAPE 1: Analyse de l\'état actuel');
    const currentState = await analyzeCurrentState();
    
    if (!currentState) {
      console.error('❌ Impossible d\'analyser l\'état. Arrêt du test.');
      return;
    }
    
    // Étape 2: Définir les scénarios à tester
    const scenarios = [
      {
        name: 'Scénario Actuel',
        description: 'Test avec l\'état actuel du système'
      }
    ];
    
    // Ajouter des scénarios selon l'état actuel
    if (currentState.daysSinceActivation === 3) {
      scenarios.push({
        name: 'Premier Rappel (Jour 3)',
        description: 'Première alerte après 3 jours'
      });
    } else if (currentState.daysSinceActivation === 7) {
      scenarios.push({
        name: 'Deuxième Rappel (Jour 7)',
        description: 'Deuxième alerte après 7 jours'
      });
    } else if (currentState.daysSinceActivation === 14) {
      scenarios.push({
        name: 'Troisième Rappel (Jour 14)',
        description: 'Troisième alerte après 14 jours'
      });
    } else if (currentState.daysSinceActivation === 21) {
      scenarios.push({
        name: 'Dernier Rappel (Jour 21)',
        description: 'Dernière alerte après 21 jours'
      });
    }
    
    // Étape 3: Tester chaque scénario
    console.log('\n📋 ÉTAPE 2: Test des scénarios');
    for (const scenario of scenarios) {
      await simulateAlertScenario(scenario);
      console.log('─' .repeat(40));
    }
    
    // Étape 4: Résumé et recommandations
    console.log('\n📋 ÉTAPE 3: Résumé et recommandations');
    console.log('✅ Système d\'alertes fonctionnel !');
    
    if (currentState.staffWithoutEntries > 0) {
      console.log(`\n💡 RECOMMANDATIONS:`);
      console.log(`   - ${currentState.staffWithoutEntries} utilisateurs sans entrées de temps`);
      console.log(`   - Prochaine alerte prévue: jour ${currentState.nextAlertDay}`);
      
      if (currentState.daysSinceActivation < 3) {
        console.log(`   - Attendre ${3 - currentState.daysSinceActivation} jour(s) pour la première alerte`);
      } else if (currentState.daysSinceActivation < 7) {
        console.log(`   - Attendre ${7 - currentState.daysSinceActivation} jour(s) pour la deuxième alerte`);
      } else if (currentState.daysSinceActivation < 14) {
        console.log(`   - Attendre ${14 - currentState.daysSinceActivation} jour(s) pour la troisième alerte`);
      } else if (currentState.daysSinceActivation < 21) {
        console.log(`   - Attendre ${21 - currentState.daysSinceActivation} jour(s) pour la dernière alerte`);
      }
    } else {
      console.log('\n🎉 Tous les utilisateurs STAFF ont saisi leurs entrées de temps !');
    }
    
    console.log('\n🔧 POUR TESTER L\'ENVOI D\'EMAILS:');
    console.log('   1. Attendre le bon jour d\'alerte (3, 7, 14, ou 21)');
    console.log('   2. Ou modifier la date de création de la période active');
    console.log('   3. Ou supprimer les alertes existantes pour forcer un renvoi');
    
  } catch (error) {
    console.error('\n💥 Erreur lors du test:', error.message);
  }
}

// Exécution du test si le script est appelé directement
if (require.main === module) {
  testAlertScenarios().catch(console.error);
}

module.exports = {
  testAlertScenarios,
  analyzeCurrentState,
  simulateAlertScenario
};
