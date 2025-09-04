import { NextRequest, NextResponse } from 'next/server';
import { generateTimesheetPDFWithPDFMaker } from '@/lib/pdf-maker-generator';

// Données de test avec des noms longs pour tester le retour à la ligne
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

const testDataWithPlaceholder = {
  ...testTimesheetData,
  signatureInfo: undefined
};

const testDataWithLongNames = {
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testType = searchParams.get('type') || 'signature';

    let dataToUse;
    let filename;

    switch (testType) {
      case 'placeholder':
        dataToUse = testDataWithPlaceholder;
        filename = 'test-pdf-landscape-placeholder.pdf';
        break;
      case 'long-names':
        dataToUse = testDataWithLongNames;
        filename = 'test-pdf-landscape-long-names.pdf';
        break;
      case 'signature':
      default:
        dataToUse = testTimesheetData;
        filename = 'test-pdf-landscape-with-signature.pdf';
        break;
    }

    console.log(`🧪 Génération PDF de test: ${testType}`);
    console.log(`📊 Données: ${dataToUse.timeEntries.length} entrées, ${dataToUse.totalHours}h, ${dataToUse.totalCalculatedCost} USD`);

    // Générer le PDF
    const pdfBytes = await generateTimesheetPDFWithPDFMaker(dataToUse);

    // Retourner le PDF
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': pdfBytes.length.toString(),
      },
    });

  } catch (error) {
    console.error('❌ Erreur lors de la génération du PDF de test:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la génération du PDF de test',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testType, customData } = body;

    let dataToUse;
    let filename;

    if (customData) {
      // Utiliser les données personnalisées fournies
      dataToUse = customData;
      filename = 'test-pdf-landscape-custom.pdf';
    } else {
      // Utiliser les données de test prédéfinies
      switch (testType) {
        case 'placeholder':
          dataToUse = testDataWithPlaceholder;
          filename = 'test-pdf-landscape-placeholder.pdf';
          break;
        case 'long-names':
          dataToUse = testDataWithLongNames;
          filename = 'test-pdf-landscape-long-names.pdf';
          break;
        case 'signature':
        default:
          dataToUse = testTimesheetData;
          filename = 'test-pdf-landscape-with-signature.pdf';
          break;
      }
    }

    console.log(`🧪 Génération PDF de test (POST): ${testType || 'custom'}`);
    console.log(`📊 Données: ${dataToUse.timeEntries.length} entrées, ${dataToUse.totalHours}h, ${dataToUse.totalCalculatedCost} USD`);

    // Générer le PDF
    const pdfBytes = await generateTimesheetPDFWithPDFMaker(dataToUse);

    // Retourner le PDF
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': pdfBytes.length.toString(),
      },
    });

  } catch (error) {
    console.error('❌ Erreur lors de la génération du PDF de test (POST):', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la génération du PDF de test',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}
