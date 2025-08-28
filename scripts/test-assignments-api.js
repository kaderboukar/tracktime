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

console.log('Token généré:', token);

// Test de l'API
const testAPI = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/assignments', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    console.log('Réponse API:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Erreur:', error);
  }
};

testAPI();
