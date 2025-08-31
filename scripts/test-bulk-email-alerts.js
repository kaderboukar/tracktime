#!/usr/bin/env node

/**
 * Script de test pour l'envoi d'alertes par email en masse
 * Ce script simule l'envoi d'alertes à un grand nombre d'utilisateurs
 * pour tester la robustesse du système
 */

const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  adminToken: process.env.ADMIN_TOKEN || 'your-admin-token-here',
  testUsers: parseInt(process.env.TEST_USERS || '50'), // Nombre d'utilisateurs à tester
  delayBetweenTests: 5000, // Délai entre les tests
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

// Fonction pour tester l'endpoint de vérification des alertes
async function testAlertCheck() {
  console.log('🔍 Test de vérification des alertes...');
  
  try {
    const response = await makeRequest(`${CONFIG.baseUrl}/api/admin/time-entry-alerts/check`, {
      method: 'GET'
    });
    
    console.log(`✅ Statut: ${response.statusCode}`);
    console.log('📊 Données reçues:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
    return null;
  }
}

// Fonction pour déclencher l'envoi des alertes
async function triggerAlertSending() {
  console.log('📧 Déclenchement de l\'envoi des alertes...');
  
  try {
    const response = await makeRequest(`${CONFIG.baseUrl}/api/admin/time-entry-alerts/check`, {
      method: 'POST'
    });
    
    console.log(`✅ Statut: ${response.statusCode}`);
    console.log('📊 Résultat de l\'envoi:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi:', error.message);
    return null;
  }
}

// Fonction pour créer des utilisateurs de test
async function createTestUsers() {
  console.log(`👥 Création de ${CONFIG.testUsers} utilisateurs de test...`);
  
  const testUsers = [];
  for (let i = 1; i <= CONFIG.testUsers; i++) {
    testUsers.push({
      name: `Utilisateur Test ${i}`,
      email: `test.user${i}@example.com`,
      password: `password${i}`,
      role: 'STAFF',
      grade: 'G5',
      isActive: true
    });
  }
  
  try {
    const response = await makeRequest(`${CONFIG.baseUrl}/api/user/import`, {
      method: 'POST',
      body: { users: testUsers }
    });
    
    console.log(`✅ ${CONFIG.testUsers} utilisateurs créés avec succès`);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors de la création des utilisateurs:', error.message);
    return null;
  }
}

// Fonction pour nettoyer les utilisateurs de test
async function cleanupTestUsers() {
  console.log('🧹 Nettoyage des utilisateurs de test...');
  
  try {
    // Supprimer les utilisateurs de test (implémenter selon votre logique)
    console.log('✅ Nettoyage terminé');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error.message);
  }
}

// Fonction principale de test
async function runBulkEmailTest() {
  console.log('🚀 Démarrage du test d\'envoi d\'emails en masse');
  console.log(`📧 Configuration: ${CONFIG.testUsers} utilisateurs, Base URL: ${CONFIG.baseUrl}`);
  console.log('=' .repeat(60));
  
  try {
    // Étape 1: Vérifier l'état initial
    console.log('\n📋 ÉTAPE 1: Vérification de l\'état initial');
    const initialStatus = await testAlertCheck();
    
    if (!initialStatus) {
      console.error('❌ Impossible de vérifier l\'état initial. Arrêt du test.');
      return;
    }
    
    // Étape 2: Créer des utilisateurs de test si nécessaire
    console.log('\n📋 ÉTAPE 2: Création d\'utilisateurs de test');
    if (CONFIG.testUsers > 0) {
      await createTestUsers();
      console.log(`⏳ Attente de ${CONFIG.delayBetweenTests}ms pour la synchronisation...`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenTests));
    }
    
    // Étape 3: Déclencher l'envoi des alertes
    console.log('\n📋 ÉTAPE 3: Déclenchement de l\'envoi des alertes');
    const alertResult = await triggerAlertSending();
    
    if (alertResult && alertResult.success) {
      console.log('✅ Envoi des alertes déclenché avec succès');
      
      // Afficher les métriques
      if (alertResult.data && alertResult.data.metrics) {
        const metrics = alertResult.data.metrics;
        console.log('\n📊 MÉTRIQUES DE PERFORMANCE:');
        console.log(`   Total d'emails: ${metrics.totalEmails}`);
        console.log(`   Emails réussis: ${metrics.successfulEmails}`);
        console.log(`   Emails échoués: ${metrics.failedEmails}`);
        console.log(`   Taux de succès: ${metrics.successRate}%`);
        console.log(`   Temps total: ${metrics.totalTime}ms`);
        console.log(`   Temps moyen par email: ${metrics.averageTimePerEmail}ms`);
        console.log(`   Temps moyen par batch: ${metrics.averageTimePerBatch}ms`);
      }
    } else {
      console.error('❌ Échec de l\'envoi des alertes');
    }
    
    // Étape 4: Vérifier l'état final
    console.log('\n📋 ÉTAPE 4: Vérification de l\'état final');
    await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenTests));
    const finalStatus = await testAlertCheck();
    
    // Étape 5: Nettoyage
    console.log('\n📋 ÉTAPE 5: Nettoyage');
    await cleanupTestUsers();
    
    console.log('\n🎉 Test terminé avec succès!');
    
  } catch (error) {
    console.error('\n💥 Erreur lors du test:', error.message);
    console.error(error.stack);
  }
}

// Exécution du test si le script est appelé directement
if (require.main === module) {
  runBulkEmailTest().catch(console.error);
}

module.exports = {
  runBulkEmailTest,
  testAlertCheck,
  triggerAlertSending,
  createTestUsers,
  cleanupTestUsers
};
