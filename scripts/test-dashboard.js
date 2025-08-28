const jwt = require('jsonwebtoken');

// Créer un token de test pour staff1@undp.org (ID: 4)
const payload = {
  userId: 4,
  role: 'STAFF',
  email: 'staff1@undp.org',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 800, // 800 secondes
  aud: 'time-tracking-app',
  iss: 'time-tracking-app'
};

const token = jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key');

console.log('🔑 Token généré pour staff1@undp.org (ID: 4):');
console.log(token);
console.log('\n📋 Instructions de test:');
console.log('1. Ouvrez http://localhost:3000 dans votre navigateur');
console.log('2. Ouvrez les outils de développement (F12)');
console.log('3. Allez dans l\'onglet Console');
console.log('4. Exécutez cette commande pour vous connecter:');
console.log(`localStorage.setItem('token', '${token}')`);
console.log('5. Rechargez la page (F5)');
console.log('6. Vous devriez voir les projets assignés dans la section "Mes projets assignés"');
console.log('\n🔍 Si les projets n\'apparaissent toujours pas, vérifiez:');
console.log('- Les logs dans la console du navigateur');
console.log('- L\'onglet Network pour voir les appels API');
console.log('- Si l\'API /api/assignments retourne des données');
