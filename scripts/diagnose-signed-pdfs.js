#!/usr/bin/env node

/**
 * Script de diagnostic des PDFs signés stockés en base de données
 * Vérifie l'intégrité des données et identifie les problèmes
 */

console.log('🔍 Diagnostic des PDFs signés en base de données\n');

// Simulation des données de base pour diagnostic
function simulateDatabaseData() {
  console.log('📊 Simulation des données de base...\n');

  // Cas 1: PDF valide
  const validPdf = {
    id: 1,
    signedPdfData: Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n%%EOF', 'utf8'),
    signatureStatus: 'SIGNED',
    user: { name: 'John Doe' }
  };

  // Cas 2: PDF vide ou null
  const emptyPdf = {
    id: 2,
    signedPdfData: null,
    signatureStatus: 'SIGNED',
    user: { name: 'Jane Smith' }
  };

  // Cas 3: PDF corrompu (pas de signature %PDF)
  const corruptedPdf = {
    id: 3,
    signedPdfData: Buffer.from('INVALID_PDF_CONTENT', 'utf8'),
    signatureStatus: 'SIGNED',
    user: { name: 'Bob Johnson' }
  };

  // Cas 4: PDF avec données vides
  const zeroLengthPdf = {
    id: 4,
    signedPdfData: Buffer.alloc(0),
    signatureStatus: 'SIGNED',
    user: { name: 'Alice Brown' }
  };

  return [validPdf, emptyPdf, corruptedPdf, zeroLengthPdf];
}

// Fonction de diagnostic d'un PDF
function diagnosePdf(pdfData, id) {
  console.log(`🔍 Diagnostic du PDF ID ${id} (${pdfData.user.name}):`);
  
  // Vérifier si les données existent
  if (!pdfData.signedPdfData) {
    console.log(`  ❌ PROBLÈME: signedPdfData est NULL ou undefined`);
    console.log(`  💡 Solution: Vérifier le processus de stockage des signatures`);
    return false;
  }

  // Vérifier le type de données
  console.log(`  📋 Type de données: ${typeof pdfData.signedPdfData}`);
  
  if (Buffer.isBuffer(pdfData.signedPdfData)) {
    console.log(`  ✅ Format: Buffer valide`);
  } else if (pdfData.signedPdfData instanceof Uint8Array) {
    console.log(`  ✅ Format: Uint8Array valide`);
  } else {
    console.log(`  ❌ PROBLÈME: Format de données invalide`);
    console.log(`  💡 Solution: Convertir en Buffer avant stockage`);
    return false;
  }

  // Vérifier la taille
  const dataLength = pdfData.signedPdfData.length;
  console.log(`  📏 Taille des données: ${dataLength} bytes`);
  
  if (dataLength === 0) {
    console.log(`  ❌ PROBLÈME: Données vides (0 bytes)`);
    console.log(`  💡 Solution: Vérifier le processus de stockage`);
    return false;
  }

  if (dataLength < 100) {
    console.log(`  ⚠️  ATTENTION: PDF très petit (${dataLength} bytes) - possiblement corrompu`);
  }

  // Vérifier la signature PDF
  if (dataLength >= 4) {
    const signature = pdfData.signedPdfData.slice(0, 4).toString();
    console.log(`  🎯 Signature PDF: "${signature}"`);
    
    if (signature === '%PDF') {
      console.log(`  ✅ Signature PDF valide`);
    } else {
      console.log(`  ❌ PROBLÈME: Signature PDF invalide - attendu "%PDF", reçu "${signature}"`);
      console.log(`  💡 Solution: Vérifier l'intégrité lors du stockage`);
      return false;
    }
  } else {
    console.log(`  ❌ PROBLÈME: Données trop courtes pour vérifier la signature`);
    return false;
  }

  // Vérifier la fin du PDF
  if (dataLength >= 6) {
    const end = pdfData.signedPdfData.slice(-6).toString();
    console.log(`  🏁 Fin du PDF: "${end}"`);
    
    if (end.includes('%%EOF')) {
      console.log(`  ✅ Fin de PDF valide`);
    } else {
      console.log(`  ⚠️  ATTENTION: Fin de PDF suspecte`);
    }
  }

  console.log(`  ✅ PDF ID ${id} semble valide\n`);
  return true;
}

// Fonction de test de conversion
function testConversion(pdfData, id) {
  console.log(`🔄 Test de conversion pour le PDF ID ${id}:`);
  
  try {
    let pdfBuffer;
    
    if (Buffer.isBuffer(pdfData.signedPdfData)) {
      pdfBuffer = pdfData.signedPdfData;
      console.log(`  ✅ Données déjà en Buffer`);
    } else if (pdfData.signedPdfData instanceof Uint8Array) {
      pdfBuffer = Buffer.from(pdfData.signedPdfData);
      console.log(`  ✅ Conversion Uint8Array → Buffer réussie`);
    } else {
      pdfBuffer = Buffer.from(pdfData.signedPdfData);
      console.log(`  ✅ Conversion en Buffer réussie`);
    }

    // Vérifier que le buffer est valide
    if (!pdfBuffer || pdfBuffer.length === 0) {
      console.log(`  ❌ PROBLÈME: Buffer invalide après conversion`);
      return false;
    }

    // Vérifier la signature après conversion
    const signature = pdfBuffer.slice(0, 4).toString();
    if (signature === '%PDF') {
      console.log(`  ✅ Signature PDF maintenue après conversion`);
    } else {
      console.log(`  ❌ PROBLÈME: Signature PDF perdue après conversion`);
      return false;
    }

    console.log(`  ✅ Conversion réussie pour le PDF ID ${id}\n`);
    return true;

  } catch (error) {
    console.log(`  ❌ ERREUR lors de la conversion: ${error.message}`);
    return false;
  }
}

// Fonction de simulation de téléchargement
function simulateDownload(pdfData, id) {
  console.log(`📥 Simulation de téléchargement pour le PDF ID ${id}:`);
  
  try {
    // Vérifier que les données existent
    if (!pdfData.signedPdfData) {
      console.log(`  ❌ Impossible de télécharger: données manquantes`);
      return false;
    }

    // Convertir en Buffer si nécessaire
    let pdfBuffer;
    if (Buffer.isBuffer(pdfData.signedPdfData)) {
      pdfBuffer = pdfData.signedPdfData;
    } else {
      pdfBuffer = Buffer.from(pdfData.signedPdfData);
    }

    // Vérifier la validité du buffer
    if (!pdfBuffer || pdfBuffer.length === 0) {
      console.log(`  ❌ Impossible de télécharger: buffer invalide`);
      return false;
    }

    // Vérifier la signature
    const signature = pdfBuffer.slice(0, 4).toString();
    if (signature !== '%PDF') {
      console.log(`  ❌ Impossible de télécharger: signature PDF invalide`);
      return false;
    }

    // Simuler la création des headers HTTP
    const headers = {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="test_${id}.pdf"`,
      'Content-Length': pdfBuffer.length.toString(),
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    };

    console.log(`  ✅ Headers HTTP créés:`, headers);
    console.log(`  ✅ Téléchargement simulé réussi pour le PDF ID ${id}\n`);
    return true;

  } catch (error) {
    console.log(`  ❌ ERREUR lors du téléchargement simulé: ${error.message}`);
    return false;
  }
}

// Fonction principale de diagnostic
function runDiagnosis() {
  console.log('🚀 Démarrage du diagnostic complet...\n');

  // Simuler les données de base
  const pdfs = simulateDatabaseData();
  
  let validPdfs = 0;
  let problematicPdfs = 0;

  // Diagnostiquer chaque PDF
  pdfs.forEach((pdf, index) => {
    const isValid = diagnosePdf(pdf, pdf.id);
    if (isValid) {
      validPdfs++;
      
      // Tester la conversion
      testConversion(pdf, pdf.id);
      
      // Simuler le téléchargement
      simulateDownload(pdf, pdf.id);
    } else {
      problematicPdfs++;
    }
    
    console.log('─'.repeat(50));
  });

  // Résumé du diagnostic
  console.log('📋 RÉSUMÉ DU DIAGNOSTIC');
  console.log('========================');
  console.log(`✅ PDFs valides: ${validPdfs}`);
  console.log(`❌ PDFs problématiques: ${problematicPdfs}`);
  console.log(`📊 Total analysé: ${pdfs.length}`);

  if (problematicPdfs === 0) {
    console.log('\n🎯 DIAGNOSTIC TERMINÉ');
    console.log('✅ Tous les PDFs semblent valides');
    console.log('🔍 Le problème pourrait être dans :');
    console.log('   - La réponse HTTP du serveur');
    console.log('   - Les headers de téléchargement');
    console.log('   - La gestion côté client');
  } else {
    console.log('\n⚠️  PROBLÈMES DÉTECTÉS');
    console.log('Vérifiez les erreurs ci-dessus');
    console.log('\n🔧 SOLUTIONS RECOMMANDÉES:');
    console.log('1. Vérifier le processus de stockage des signatures');
    console.log('2. S\'assurer que les PDFs sont correctement encodés');
    console.log('3. Vérifier l\'intégrité des données avant stockage');
    console.log('4. Ajouter des validations lors du stockage');
  }

  return problematicPdfs === 0;
}

// Exécuter le diagnostic si le script est appelé directement
if (require.main === module) {
  runDiagnosis();
}

module.exports = {
  diagnosePdf,
  testConversion,
  simulateDownload,
  runDiagnosis
};
