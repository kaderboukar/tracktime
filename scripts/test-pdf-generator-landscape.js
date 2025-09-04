const fs = require('fs');
const path = require('path');

// Simuler les données de test avec des noms longs pour tester le retour à la ligne
const testTimesheetData = {
  userName: "Boubacar Diallo",
  userGrade: "Senior Developer",
  userProformaCost: 150,
  totalHours: 160,
  totalCalculatedCost: 24000,
  year: 2025,
  semester: "S1",
  timeEntries: [
    {
      projectName: "Développement Application Mobile UNDP Digital Hub pour la Gestion des Projets de Développement Durable",
      projectNumber: "PROJ001",
      activityName: "Formation des Utilisateurs et Documentation Technique Complète du Système",
      hours: 40,
      cost: 6000
    },
    {
      projectName: "Système de Gestion des Ressources Humaines et Suivi des Performances",
      projectNumber: "PROJ002", 
      activityName: "Développement des Modules de Reporting et Tableaux de Bord Analytiques",
      hours: 35,
      cost: 5250
    },
    {
      projectName: "Plateforme de Collaboration et Communication Interne",
      projectNumber: "PROJ003",
      activityName: "Intégration des Systèmes de Messagerie et Vidéoconférence",
      hours: 30,
      cost: 4500
    },
    {
      projectName: "Application de Suivi des Objectifs de Développement Durable (ODD)",
      projectNumber: "PROJ004",
      activityName: "Conception et Implémentation des Algorithmes de Calcul des Métriques de Performance",
      hours: 25,
      cost: 3750
    },
    {
      projectName: "Système de Gestion Documentaire et Archivage Numérique",
      projectNumber: "PROJ005",
      activityName: "Migration des Données Historiques et Mise en Place des Procédures de Sauvegarde",
      hours: 30,
      cost: 4500
    }
  ],
  signatureInfo: {
    signedBy: "Boubacar Diallo",
    signedAt: new Date(),
    signatureToken: "test-token-12345"
  }
};

// Fonction pour tester le générateur PDF
async function testPDFGenerator() {
  try {
    console.log('🚀 Démarrage du test du générateur PDF en format paysage...');
    
    // Importer le générateur PDF
    const { generateTimesheetPDFWithPDFMaker } = require('../src/lib/pdf-maker-generator.ts');
    
    console.log('📊 Données de test:');
    console.log(`- Utilisateur: ${testTimesheetData.userName}`);
    console.log(`- Période: ${testTimesheetData.year} ${testTimesheetData.semester}`);
    console.log(`- Nombre d'entrées: ${testTimesheetData.timeEntries.length}`);
    console.log(`- Total heures: ${testTimesheetData.totalHours}h`);
    console.log(`- Total coût: ${testTimesheetData.totalCalculatedCost.toLocaleString('fr-FR')} USD`);
    
    // Générer le PDF
    console.log('\n🔄 Génération du PDF...');
    const pdfBytes = await generateTimesheetPDFWithPDFMaker(testTimesheetData);
    
    // Sauvegarder le PDF
    const outputPath = path.join(__dirname, '..', 'test-pdf-landscape-with-long-names.pdf');
    fs.writeFileSync(outputPath, pdfBytes);
    
    console.log(`✅ PDF généré avec succès !`);
    console.log(`📁 Fichier sauvegardé: ${outputPath}`);
    console.log(`📏 Taille du fichier: ${(pdfBytes.length / 1024).toFixed(2)} KB`);
    
    // Test avec signature placeholder
    console.log('\n🔄 Test avec signature placeholder...');
    const testDataWithoutSignature = { ...testTimesheetData };
    delete testDataWithoutSignature.signatureInfo;
    
    const pdfBytesPlaceholder = await generateTimesheetPDFWithPDFMaker(testDataWithoutSignature);
    const outputPathPlaceholder = path.join(__dirname, '..', 'test-pdf-landscape-placeholder.pdf');
    fs.writeFileSync(outputPathPlaceholder, pdfBytesPlaceholder);
    
    console.log(`✅ PDF avec placeholder généré !`);
    console.log(`📁 Fichier: ${outputPathPlaceholder}`);
    
    // Test avec des noms encore plus longs
    console.log('\n🔄 Test avec des noms extrêmement longs...');
    const testDataLongNames = {
      ...testTimesheetData,
      timeEntries: [
        {
          projectName: "Développement d'une Application Mobile Complète pour la Gestion Intégrée des Projets de Développement Durable et de Suivi des Objectifs de l'Agenda 2030 des Nations Unies",
          projectNumber: "PROJ-2025-001-UNDP-DIGITAL-HUB",
          activityName: "Formation Complète des Utilisateurs Finaux, Documentation Technique Détaillée, Mise en Place des Procédures de Maintenance et Support Technique Continu",
          hours: 50,
          cost: 7500
        },
        {
          projectName: "Système de Gestion Avancée des Ressources Humaines avec Intelligence Artificielle et Analyse Prédictive des Performances",
          projectNumber: "PROJ-2025-002-AI-HR-SYSTEM",
          activityName: "Développement des Modules d'Intelligence Artificielle, Implémentation des Algorithmes de Machine Learning, Création des Tableaux de Bord Interactifs et Rapports Automatisés",
          hours: 45,
          cost: 6750
        }
      ]
    };
    
    const pdfBytesLongNames = await generateTimesheetPDFWithPDFMaker(testDataLongNames);
    const outputPathLongNames = path.join(__dirname, '..', 'test-pdf-landscape-extreme-long-names.pdf');
    fs.writeFileSync(outputPathLongNames, pdfBytesLongNames);
    
    console.log(`✅ PDF avec noms extrêmes généré !`);
    console.log(`📁 Fichier: ${outputPathLongNames}`);
    
    console.log('\n🎉 Tous les tests sont terminés avec succès !');
    console.log('\n📋 Résumé des fichiers générés:');
    console.log(`1. ${outputPath} - PDF avec signature`);
    console.log(`2. ${outputPathPlaceholder} - PDF avec placeholder`);
    console.log(`3. ${outputPathLongNames} - PDF avec noms extrêmement longs`);
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Fonction pour tester avec des données réelles (si disponibles)
async function testWithRealData() {
  try {
    console.log('\n🔄 Test avec des données réelles...');
    
    // Essayer de charger des données réelles depuis l'API
    const response = await fetch('http://localhost:3000/api/time-entries');
    if (response.ok) {
      const data = await response.json();
      console.log('📊 Données réelles chargées:', data.length, 'entrées');
      
      // Créer des données de test basées sur les données réelles
      if (data.length > 0) {
        const realData = {
          userName: "Test User Real Data",
          userGrade: "Developer",
          userProformaCost: 100,
          totalHours: 80,
          totalCalculatedCost: 8000,
          year: 2025,
          semester: "S1",
          timeEntries: data.slice(0, 3).map(entry => ({
            projectName: entry.project?.name || "Projet Test",
            projectNumber: entry.project?.id ? `PROJ-${entry.project.id}` : "PROJ001",
            activityName: entry.activity?.name || "Activité Test",
            hours: entry.hours || 20,
            cost: (entry.hours || 20) * 100
          })),
          signatureInfo: {
            signedBy: "Test User Real Data",
            signedAt: new Date(),
            signatureToken: "real-test-token"
          }
        };
        
        const { generateTimesheetPDFWithPDFMaker } = require('../src/lib/pdf-maker-generator.ts');
        const pdfBytes = await generateTimesheetPDFWithPDFMaker(realData);
        
        const outputPath = path.join(__dirname, '..', 'test-pdf-landscape-real-data.pdf');
        fs.writeFileSync(outputPath, pdfBytes);
        
        console.log(`✅ PDF avec données réelles généré !`);
        console.log(`📁 Fichier: ${outputPath}`);
      }
    } else {
      console.log('⚠️ Impossible de charger les données réelles (serveur non démarré)');
    }
  } catch (error) {
    console.log('⚠️ Test avec données réelles ignoré:', error.message);
  }
}

// Exécuter les tests
async function runAllTests() {
  console.log('🧪 === TEST DU GÉNÉRATEUR PDF FORMAT PAYSAGE ===\n');
  
  await testPDFGenerator();
  await testWithRealData();
  
  console.log('\n✨ Tests terminés ! Vérifiez les fichiers PDF générés.');
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  runAllTests();
}

module.exports = { testPDFGenerator, testWithRealData, runAllTests };
