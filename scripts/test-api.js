const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function testAPI() {
  try {
    console.log('🧪 Test de l\'API avec authentification...\n');

    // 1. Récupérer un utilisateur ADMIN pour créer un token
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      console.log('❌ Aucun utilisateur ADMIN trouvé');
      return;
    }

    console.log('✅ Utilisateur ADMIN trouvé:', adminUser.name);

    // 2. Créer un token JWT
    const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
    const token = jwt.sign(
      { userId: adminUser.id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('✅ Token JWT créé');

    // 3. Tester l'API GET /api/time-periods
    console.log('\n3. Test de GET /api/time-periods...');
    
    const fetch = require('node-fetch');
    const response = await fetch('http://localhost:3000/api/time-periods', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', result);

    if (response.ok) {
      console.log('✅ API GET fonctionne correctement');
    } else {
      console.log('❌ Erreur API GET');
    }

    // 4. Tester l'API POST /api/time-periods
    console.log('\n4. Test de POST /api/time-periods...');
    
    const postResponse = await fetch('http://localhost:3000/api/time-periods', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        year: 2027,
        semester: 'S1',
        isActive: false
      })
    });

    const postResult = await postResponse.json();
    console.log('Status:', postResponse.status);
    console.log('Response:', postResult);

    if (postResponse.ok) {
      console.log('✅ API POST fonctionne correctement');
    } else {
      console.log('❌ Erreur API POST');
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAPI();
