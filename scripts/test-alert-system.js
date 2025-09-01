#!/usr/bin/env node

/**
 * Script de test pour vérifier le système d'alertes
 * Teste avec des données réelles de la base
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

// Fonction pour tester l'état des alertes
async function testAlertStatus() {
  console.log('🔍 Test de l\'état des alertes...');
  
  try {
    const response = await makeRequest(`${CONFIG.baseUrl}/api/admin/time-entry-alerts/check`, {
      method: 'GET'
    });
    
    console.log(`✅ Statut: ${response.statusCode}`);
    
    if (response.data && response.data.success) {
      const data = response.data.data;
      console.log('\n📊 ÉTAT DES ALERTES:');
      console.log(`   Période active: ${data.activePeriod.year} - ${data.activePeriod.semester}`);
      console.log(`   Jours depuis activation: ${data.daysSinceActivation}`);
      console.log(`   Total STAFF: ${data.totalStaff}`);
      console.log(`   STAFF sans entrées: ${data.staffWithoutEntries}`);
      console.log(`   Taux de conformité: ${data.complianceRate}%`);
      console.log(`   Prochaine alerte: jour ${data.nextAlertDay}`);
      
      if (data.alertStats && data.alertStats.length > 0) {
        console.log('\n📈 STATISTIQUES DES ALERTES:');
        data.alertStats.forEach(stat => {
          console.log(`   ${stat.alertType}: ${stat._count.id} alertes envoyées`);
        });
      } else {
        console.log('\n📈 Aucune alerte envoyée pour cette période');
      }
    } else {
      console.error('❌ Erreur lors de la récupération du statut');
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
    return null;
  }
}

// Fonction pour déclencher l'envoi des alertes
async function triggerAlertSending() {
  console.log('\n📧 Déclenchement de l\'envoi des alertes...');
  
  try {
    const response = await makeRequest(`${CONFIG.baseUrl}/api/admin/time-entry-alerts/check`, {
      method: 'POST'
    });
    
    console.log(`✅ Statut: ${response.statusCode}`);
    
    if (response.data && response.data.success) {
      const data = response.data.data;
      console.log('\n📊 RÉSULTAT DE L\'ENVOI:');
      console.log(`   Type d'alerte: ${data.alertType}`);
      console.log(`   Alertes envoyées: ${data.totalAlertsSent}`);
      console.log(`   Alertes échouées: ${data.totalAlertsFailed}`);
      console.log(`   Taux de succès: ${data.successRate}%`);
      
      if (data.metrics) {
        const metrics = data.metrics;
        console.log('\n📈 MÉTRIQUES DÉTAILLÉES:');
        console.log(`   Total d'emails: ${metrics.totalEmails}`);
        console.log(`   Emails réussis: ${metrics.successfulEmails}`);
        console.log(`   Emails échoués: ${metrics.failedEmails}`);
        console.log(`   Temps total: ${metrics.totalTime}ms`);
        console.log(`   Temps moyen par email: ${metrics.averageTimePerEmail}ms`);
        console.log(`   Temps moyen par batch: ${metrics.averageTimePerBatch}ms`);
      }
      
      if (data.sentAlerts && data.sentAlerts.length > 0) {
        console.log('\n✅ ALERTES ENVOYÉES:');
        data.sentAlerts.slice(0, 5).forEach(alert => {
          console.log(`   ${alert.userName} (${alert.userEmail}) - ${alert.timeTaken}ms`);
        });
        if (data.sentAlerts.length > 5) {
          console.log(`   ... et ${data.sentAlerts.length - 5} autres`);
        }
      }
      
      if (data.failedEmails && data.failedEmails.length > 0) {
        console.log('\n❌ ALERTES ÉCHOUÉES:');
        data.failedEmails.slice(0, 5).forEach(failed => {
          console.log(`   ${failed.userName} (${failed.userEmail}) - ${failed.reason}`);
        });
        if (data.failedEmails.length > 5) {
          console.log(`   ... et ${data.failedEmails.length - 5} autres`);
        }
      }
    } else {
      console.error('❌ Échec de l\'envoi des alertes');
      if (response.data && response.data.message) {
        console.error(`   Message: ${response.data.message}`);
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi:', error.message);
    return null;
  }
}

// Fonction pour analyser les logs
function analyzeLogs(logs) {
  console.log('\n🔍 ANALYSE DES LOGS:');
  
  // Extraire les informations clés
  const staffCount = logs.match(/(\d+) utilisateurs STAFF sans entrées de temps/);
  const alertCount = logs.match(/(\d+) utilisateurs à alerter pour (\w+)/);
  const batchConfig = logs.match(/Configuration: batchSize=(\d+), délai entre batches=(\d+)ms/);
  const metrics = logs.match(/Métriques: Succès: (\d+), Échecs: (\d+), Taux: (\d+)%/);
  
  if (staffCount) {
    console.log(`   📊 STAFF identifiés: ${staffCount[1]} utilisateurs`);
  }
  
  if (alertCount) {
    console.log(`   📧 Alertes à envoyer: ${alertCount[1]} utilisateurs pour ${alertCount[2]}`);
  }
  
  if (batchConfig) {
    console.log(`   ⚙️ Configuration batch: ${batchConfig[1]} emails, délai ${batchConfig[2]}ms`);
  }
  
  if (metrics) {
    console.log(`   📈 Performance: ${metrics[1]} succès, ${metrics[2]} échecs, ${metrics[3]}%`);
  }
  
  // Vérifier les alertes
  if (logs.includes('TAUX DE SUCCÈS CRITIQUE')) {
    console.log('   🚨 ALERTE CRITIQUE: Taux de succès très faible');
  } else if (logs.includes('TAUX DE SUCCÈS FAIBLE')) {
    console.log('   ⚠️ AVERTISSEMENT: Taux de succès faible');
  } else {
    console.log('   ✅ PERFORMANCE: Taux de succès acceptable');
  }
}

// Fonction principale de test
async function runAlertSystemTest() {
  console.log('🚀 Test du système d\'alertes par email');
  console.log(`📧 Base URL: ${CONFIG.baseUrl}`);
  console.log('=' .repeat(60));
  
  try {
    // Étape 1: Vérifier l'état actuel
    console.log('\n📋 ÉTAPE 1: Vérification de l\'état des alertes');
    const status = await testAlertStatus();
    
    if (!status) {
      console.error('❌ Impossible de vérifier l\'état. Arrêt du test.');
      return;
    }
    
    // Étape 2: Déclencher l'envoi des alertes
    console.log('\n📋 ÉTAPE 2: Test de l\'envoi des alertes');
    const alertResult = await triggerAlertSending();
    
    if (alertResult) {
      console.log('\n✅ Test terminé avec succès!');
      
      // Analyser les résultats
      if (alertResult.data && alertResult.data.metrics) {
        const metrics = alertResult.data.metrics;
        if (metrics.totalEmails === 0) {
          console.log('\n💡 EXPLICATION: Aucun email à envoyer car:');
          console.log('   - Tous les utilisateurs ont déjà reçu cette alerte');
          console.log('   - Ou la période n\'est pas au bon jour pour déclencher une alerte');
          console.log('   - Ou tous les utilisateurs ont saisi leurs entrées de temps');
        }
      }
    } else {
      console.error('\n❌ Test échoué');
    }
    
  } catch (error) {
    console.error('\n💥 Erreur lors du test:', error.message);
  }
}

// Exécution du test si le script est appelé directement
if (require.main === module) {
  runAlertSystemTest().catch(console.error);
}

module.exports = {
  runAlertSystemTest,
  testAlertStatus,
  triggerAlertSending,
  analyzeLogs
};
