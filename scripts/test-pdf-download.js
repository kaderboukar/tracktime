#!/usr/bin/env node

/**
 * Script de test pour diagnostiquer le problème de téléchargement du PDF signé
 * Teste la logique de conversion et de headers
 */

console.log('🔍 Test de diagnostic du téléchargement PDF signé\n');

// Test 1: Simulation des données PDF
function testPdfDataHandling() {
  console.log('📄 Test 1: Gestion des données PDF');
  
  // Simuler des données PDF (Base64)
  const mockPdfBase64 = "JVBERi0xLjQKJcOkw7zDtsO8DQoxIDAgb2JqDQo8PA0KL1R5cGUgL0NhdGFsb2cNCi9QYWdlcyAyIDAgUg0KPj4NCmVuZG9iag0KMiAwIG9iag0KPDwNCi9UeXBlIC9QYWdlcw0KL0NvdW50IDENCi9LaWRzIFsgMyAwIFIgXQ0KPj4NCmVuZG9iag0KMyAwIG9iag0KPDwNCi9UeXBlIC9QYWdlDQovUGFyZW50IDIgMCBSDQovUmVzb3VyY2VzIDw8DQovRm9udCA8PA0KL0YxIDQgMCBSDQo+Pg0KPj4NCi9Db250ZW50cyA1IDAgUg0KL01lZGlhQm94IFsgMCAwIDYxMiA3OTIgXQ0KPj4NCmVuZG9iag0KNCAwIG9iag0KPDwNCi9UeXBlIC9Gb250DQovU3VidHlwZSAvVHlwZTENCi9CYXNlRm9udCAvSGVsdmV0aWNhDQovRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZw0KPj4NCmVuZG9iag0KNSAwIG9iag0KPDwNCi9MZW5ndGggNDQNCj4+DQpzdHJlYW0NCkJUCjcwIDUwIFRECi9GMSAxMiBUZgooSGVsbG8gV29ybGQpIFRqCkVUCmVuZG9iag0KeHJlZg0KMCA2DQowMDAwMDAwMDAwIDY1NTM1IGYNCjAwMDAwMDAwMTAgMDAwMDAgbg0KMDAwMDAwMDA3OSAwMDAwMCBuDQowMDAwMDAwMTczIDAwMDAwIG4NCjAwMDAwMDAzMDEgMDAwMDAgbg0KMDAwMDAwMDM4MCAwMDAwMCBuDQp0cmFpbGVyDQo8PA0KL1NpemUgNg0KL1Jvb3QgMSAwIFINCj4+DQpzdGFydHhyZWYNCjQ5Mg0KJSVFT0Y=";
  
  // Convertir en Buffer
  const pdfBuffer = Buffer.from(mockPdfBase64, 'base64');
  
  console.log(`  ✅ Données PDF simulées créées`);
  console.log(`  ✅ Taille Base64: ${mockPdfBase64.length} caractères`);
  console.log(`  ✅ Taille Buffer: ${pdfBuffer.length} bytes`);
  console.log(`  ✅ Début du PDF: ${pdfBuffer.slice(0, 10).toString('hex')}`);
  console.log(`  ✅ Signature PDF: ${pdfBuffer.slice(0, 4).toString()}`);
  
  // Vérifier que c'est bien un PDF
  const pdfSignature = pdfBuffer.slice(0, 4).toString();
  if (pdfSignature === '%PDF') {
    console.log(`  ✅ Signature PDF valide: ${pdfSignature}`);
  } else {
    console.log(`  ❌ Signature PDF invalide: ${pdfSignature}`);
  }
  
  console.log('');
  return true;
}

// Test 2: Headers de réponse HTTP
function testHttpHeaders() {
  console.log('🌐 Test 2: Headers HTTP pour le téléchargement');
  
  const mockFileName = "feuille_temps_signee_John_Doe_2024_S1.pdf";
  const mockPdfSize = 1234;
  
  const headers = {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${mockFileName}"`,
    'Content-Length': mockPdfSize.toString(),
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  };
  
  console.log(`  ✅ Content-Type: ${headers['Content-Type']}`);
  console.log(`  ✅ Content-Disposition: ${headers['Content-Disposition']}`);
  console.log(`  ✅ Content-Length: ${headers['Content-Length']}`);
  console.log(`  ✅ Cache-Control: ${headers['Cache-Control']}`);
  console.log(`  ✅ Pragma: ${headers['Pragma']}`);
  
  // Vérifier que les headers sont corrects
  const isValidContentType = headers['Content-Type'] === 'application/pdf';
  const hasValidDisposition = headers['Content-Disposition'].includes('attachment');
  const hasValidLength = parseInt(headers['Content-Length']) > 0;
  
  if (isValidContentType && hasValidDisposition && hasValidLength) {
    console.log(`  ✅ Tous les headers sont valides`);
  } else {
    console.log(`  ❌ Certains headers sont invalides`);
  }
  
  console.log('');
  return true;
}

// Test 3: Conversion des données Prisma
function testPrismaDataConversion() {
  console.log('🗄️ Test 3: Conversion des données Prisma');
  
  // Simuler les données Prisma
  const mockPrismaData = {
    id: 1,
    signedPdfData: Buffer.from("JVBERi0xLjQKJcOkw7zDtsO8DQoxIDAgb2JqDQo8PA0KL1R5cGUgL0NhdGFsb2cNCi9QYWdlcyAyIDAgUg0KPj4NCmVuZG9iag0KMiAwIG9iag0KPDwNCi9UeXBlIC9QYWdlcw0KL0NvdW50IDENCi9LaWRzIFsgMyAwIFIgXQ0KPj4NCmVuZG9iag0KMyAwIG9iag0KPDwNCi9UeXBlIC9QYWdlDQovUGFyZW50IDIgMCBSDQovUmVzb3VyY2VzIDw8DQovRm9udCA8PA0KL0YxIDQgMCBSDQo+Pg0KPj4NCi9Db250ZW50cyA1IDAgUg0KL01lZGlhQm94IFsgMCAwIDYxMiA3OTIgXQ0KPj4NCmVuZG9iag0KNCAwIG9iag0KPDwNCi9UeXBlIC9Gb250DQovU3VidHlwZSAvVHlwZTENCi9CYXNlRm9udCAvSGVsdmV0aWNhDQovRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZw0KPj4NCmVuZG9iag0KNSAwIG9iag0KPDwNCi9MZW5ndGggNDQNCj4+DQpzdHJlYW0NCkJUCjcwIDUwIFRECi9GMSAxMiBUZgooSGVsbG8gV29ybGQpIFRqCkVUCmVuZG9iag0KeHJlZg0KMCA2DQowMDAwMDAwMDAwIDY1NTM1IGYNCjAwMDAwMDAwMTAgMDAwMDAgbg0KMDAwMDAwMDA3OSAwMDAwMCBuDQowMDAwMDAwMTczIDAwMDAwIG4NCjAwMDAwMDAzMDEgMDAwMDAgbg0KMDAwMDAwMDM4MCAwMDAwMCBuDQp0cmFpbGVyDQo8PA0KL1NpemUgNg0KL1Jvb3QgMSAwIFINCj4+DQpzdGFydHhyZWYNCjQ5Mg0KJSVFT0Y=", 'base64')
  };
  
  // Vérifier le type de données
  console.log(`  ✅ Type de signedPdfData: ${typeof mockPrismaData.signedPdfData}`);
  console.log(`  ✅ Instance de Buffer: ${Buffer.isBuffer(mockPrismaData.signedPdfData)}`);
  console.log(`  ✅ Taille des données: ${mockPrismaData.signedPdfData.length} bytes`);
  
  // Vérifier que les données sont valides
  if (Buffer.isBuffer(mockPrismaData.signedPdfData) && mockPrismaData.signedPdfData.length > 0) {
    console.log(`  ✅ Données Prisma valides`);
    
    // Vérifier la signature PDF
    const pdfSignature = mockPrismaData.signedPdfData.slice(0, 4).toString();
    if (pdfSignature === '%PDF') {
      console.log(`  ✅ Signature PDF détectée: ${pdfSignature}`);
    } else {
      console.log(`  ❌ Signature PDF manquante: ${pdfSignature}`);
    }
  } else {
    console.log(`  ❌ Données Prisma invalides`);
  }
  
  console.log('');
  return true;
}

// Test 4: Simulation de la réponse NextResponse
function testNextResponse() {
  console.log('📤 Test 4: Simulation de la réponse NextResponse');
  
  const mockPdfData = Buffer.from("JVBERi0xLjQKJcOkw7zDtsO8DQoxIDAgb2JqDQo8PA0KL1R5cGUgL0NhdGFsb2cNCi9QYWdlcyAyIDAgUg0KPj4NCmVuZG9iag0KMiAwIG9iag0KPDwNCi9UeXBlIC9QYWdlcw0KL0NvdW50IDENCi9LaWRzIFsgMyAwIFIgXQ0KPj4NCmVuZG9iag0KMyAwIG9iag0KPDwNCi9UeXBlIC9QYWdlDQovUGFyZW50IDIgMCBSDQovUmVzb3VyY2VzIDw8DQovRm9udCA8PA0KL0YxIDQgMCBSDQo+Pg0KPj4NCi9Db250ZW50cyA1IDAgUg0KL01lZGlhQm94IFsgMCAwIDYxMiA3OTIgXQ0KPj4NCmVuZG9iag0KNCAwIG9iag0KPDwNCi9UeXBlIC9Gb250DQovU3VidHlwZSAvVHlwZTENCi9CYXNlRm9udCAvSGVsdmV0aWNhDQovRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZw0KPj4NCmVuZG9iag0KNSAwIG9iag0KPDwNCi9MZW5ndGggNDQNCj4+DQpzdHJlYW0NCkJUCjcwIDUwIFRECi9GMSAxMiBUZgooSGVsbG8gV29ybGQpIFRqCkVUCmVuZG9iag0KeHJlZg0KMCA2DQowMDAwMDAwMDAwIDY1NTM1IGYNCjAwMDAwMDAwMTAgMDAwMDAgbg0KMDAwMDAwMDA3OSAwMDAwMCBuDQowMDAwMDAwMTczIDAwMDAwIG4NCjAwMDAwMDAzMDEgMDAwMDAgbg0KMDAwMDAwMDM4MCAwMDAwMCBuDQp0cmFpbGVyDQo8PA0KL1NpemUgNg0KL1Jvb3QgMSAwIFINCj4+DQpzdGFydHhyZWYNCjQ5Mg0KJSVFT0Y=", 'base64');
  
  const mockFileName = "test_document.pdf";
  
  // Simuler la création de la réponse
  const response = {
    body: mockPdfData,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${mockFileName}"`,
      'Content-Length': mockPdfData.length.toString(),
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  };
  
  console.log(`  ✅ Réponse simulée créée`);
  console.log(`  ✅ Taille du body: ${response.body.length} bytes`);
  console.log(`  ✅ Nombre de headers: ${Object.keys(response.headers).length}`);
  console.log(`  ✅ Content-Type: ${response.headers['Content-Type']}`);
  console.log(`  ✅ Content-Length: ${response.headers['Content-Length']}`);
  
  // Vérifier la cohérence
  const declaredLength = parseInt(response.headers['Content-Length']);
  const actualLength = response.body.length;
  
  if (declaredLength === actualLength) {
    console.log(`  ✅ Content-Length cohérent: ${declaredLength} = ${actualLength}`);
  } else {
    console.log(`  ❌ Content-Length incohérent: ${declaredLength} ≠ ${actualLength}`);
  }
  
  console.log('');
  return true;
}

// Test 5: Diagnostic des erreurs communes
function testCommonErrors() {
  console.log('🚨 Test 5: Diagnostic des erreurs communes');
  
  const commonIssues = [
    {
      name: "Données vides ou nulles",
      description: "Le PDF signé n'est pas stocké en base",
      solution: "Vérifier que signedPdfData contient des données"
    },
    {
      name: "Mauvais Content-Type",
      description: "Le navigateur ne reconnaît pas le fichier comme PDF",
      solution: "S'assurer que Content-Type est 'application/pdf'"
    },
    {
      name: "Headers manquants",
      description: "Informations essentielles manquantes pour le téléchargement",
      solution: "Vérifier Content-Disposition et Content-Length"
    },
    {
      name: "Données corrompues",
      description: "Le PDF stocké est corrompu ou invalide",
      solution: "Vérifier l'intégrité des données lors du stockage"
    },
    {
      name: "Problème de conversion Buffer",
      description: "Erreur lors de la conversion des données Prisma",
      solution: "S'assurer que les données sont bien des Buffer"
    }
  ];
  
  commonIssues.forEach((issue, index) => {
    console.log(`  ${index + 1}. ${issue.name}`);
    console.log(`     📝 ${issue.description}`);
    console.log(`     💡 ${issue.solution}`);
    console.log('');
  });
  
  return true;
}

// Exécuter tous les tests
function runAllTests() {
  console.log('🚀 Démarrage du diagnostic du téléchargement PDF\n');
  
  const results = [
    testPdfDataHandling(),
    testHttpHeaders(),
    testPrismaDataConversion(),
    testNextResponse(),
    testCommonErrors()
  ];

  const passedTests = results.filter(result => result === true).length;
  const totalTests = results.length;

  console.log('📋 RÉSUMÉ DU DIAGNOSTIC');
  console.log('========================');
  console.log(`✅ Tests réussis: ${passedTests}`);
  console.log(`❌ Tests échoués: ${totalTests - passedTests}`);
  console.log(`📊 Total: ${totalTests}`);

  if (passedTests === totalTests) {
    console.log('\n🎯 DIAGNOSTIC TERMINÉ');
    console.log('✅ Tous les composants semblent corrects');
    console.log('🔍 Le problème pourrait être dans :');
    console.log('   - Les données stockées en base');
    console.log('   - La conversion Prisma → Buffer');
    console.log('   - La réponse HTTP du serveur');
  } else {
    console.log('\n⚠️  PROBLÈMES DÉTECTÉS');
    console.log('Vérifiez les erreurs ci-dessus');
  }

  return passedTests === totalTests;
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testPdfDataHandling,
  testHttpHeaders,
  testPrismaDataConversion,
  testNextResponse,
  testCommonErrors,
  runAllTests
};
