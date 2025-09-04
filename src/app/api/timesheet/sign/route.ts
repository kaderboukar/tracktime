import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// Fonction utilitaire pour formater les dates
function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

function formatDateTime(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Fonction pour authentifier via token de signature (non utilisée actuellement)
// async function authenticateViaSignatureToken(signatureToken: string) {
//   try {
//     const signedTimesheet = await prisma.signedTimesheet.findUnique({
//       where: { signatureToken },
//       include: { user: true }
//     });

//     if (!signedTimesheet) {
//       return null;
//     }

//     if (signedTimesheet.expiresAt < new Date()) {
//       return null;
//     }

//     return {
//       userId: signedTimesheet.userId,
//       role: signedTimesheet.user.role,
//       signatureToken: signedTimesheet
//     };
//   } catch (error) {
//     console.error("Erreur lors de l'authentification via token de signature:", error);
//     return null;
//   }
// }

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const signatureToken = searchParams.get('token');

    if (!signatureToken) {
      return NextResponse.json(
        { error: 'Token de signature requis' },
        { status: 400 }
      );
    }

    // Vérifier si le token existe et est valide (pas expiré)
    const signatureRecord = await prisma.signedTimesheet.findUnique({
      where: { signatureToken },
      include: {
        user: true
      }
    });

    if (!signatureRecord) {
      return NextResponse.json(
        { error: 'Token de signature invalide ou expiré' },
        { status: 404 }
      );
    }

    // Vérifier si le token n'est pas expiré
    if (new Date() > signatureRecord.expiresAt) {
      return NextResponse.json(
        { error: 'Token de signature expiré' },
        { status: 410 }
      );
    }

    // Si déjà signé, générer et retourner le PDF signé
    if (signatureRecord.signatureStatus === 'SIGNED' && signatureRecord.signedPdfData) {
      return new NextResponse(signatureRecord.signedPdfData, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="timesheet_signee_${signatureRecord.user.name}_${signatureRecord.year}_${signatureRecord.semester}.pdf"`
        }
      });
    }

    // Afficher la page de signature
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Signature Électronique - Feuille de Temps PNUD</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f3f4f6;
          }
          .container {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
            color: white;
            border-radius: 8px;
          }
          .info-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
          }
          .sign-button {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 6px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            width: 100%;
            margin: 20px 0;
          }
          .sign-button:hover {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #6b7280;
            font-size: 12px;
          }
          .timesheet-info {
            background: white;
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
            border: 1px solid #dee2e6;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>PNUD NIGER</h1>
            <p>WORKLOAD STUDY SURVEY</p>
            <h2>Signature Électronique de Feuille de Temps</h2>
          </div>
          
          <div class="info-box">
            <h3>Détails de la feuille de temps</h3>
            <p><strong>Bénéficiaire:</strong> ${signatureRecord.user.name}</p>
            <p><strong>Email:</strong> ${signatureRecord.user.email}</p>
            <p><strong>Grade:</strong> ${signatureRecord.user.grade || 'Non renseigné'}</p>
            <p><strong>Année:</strong> ${signatureRecord.year}</p>
            <p><strong>Semestre:</strong> ${signatureRecord.semester}</p>
            <p><strong>Date de création:</strong> ${formatDate(new Date(signatureRecord.createdAt))}</p>
          </div>

          <div class="info-box">
            <h3>Matériel à signer</h3>
            <div class="timesheet-info">
              <strong>Type de document:</strong> Feuille de temps des heures travaillées<br>
              <strong>Période:</strong> ${signatureRecord.year} - ${signatureRecord.semester}<br>
              <strong>Statut actuel:</strong> En attente de signature
            </div>
          </div>

          <div class="info-box">
            <h3>Responsabilités</h3>
            <ul>
              <li>Confirmer que les heures déclarées sont exactes</li>
              <li>Valider que les activités mentionnées correspondent au travail effectué</li>
              <li>Accepter la répartition des coûts calculés</li>
              <li>Signer électroniquement pour validation finale</li>
            </ul>
          </div>

          <p>En cliquant sur le bouton ci-dessous, vous confirmez que les informations de votre feuille de temps sont exactes et acceptez la signature électronique.</p>

          <button class="sign-button" onclick="signDocument()">
            [SIGNER] Signer Électroniquement
          </button>

          <div class="footer">
            <p>Signature sécurisée - PNUD NIGER</p>
            <p>Token valide jusqu'au ${formatDateTime(signatureRecord.expiresAt)}</p>
          </div>
        </div>

        <script>
          async function signDocument() {
            if (confirm('Confirmez-vous vouloir signer cette feuille de temps électroniquement ?')) {
              try {
                const response = await fetch('/api/timesheet/sign', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    signatureToken: '${signatureToken}',
                    signedPdfData: 'manual_signature_' + Date.now()
                  })
                });

                if (response.ok) {
                  alert('Feuille de temps signée avec succès !');
                  window.location.reload();
                } else {
                  const error = await response.json();
                  alert('Erreur: ' + error.message);
                }
              } catch (error) {
                alert('Erreur lors de la signature: ' + error.message);
              }
            }
          }
        </script>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du token de signature:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { signatureToken } = await request.json();

    if (!signatureToken) {
      return NextResponse.json(
        { error: 'Token de signature requis' },
        { status: 400 }
      );
    }

    // Récupérer les informations de la requête (pour usage futur)
    // const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    // const userAgent = request.headers.get('user-agent') || 'unknown';

    // Vérifier que le token de signature existe et n'est pas expiré
    const signedTimesheet = await prisma.signedTimesheet.findUnique({
      where: { signatureToken },
      include: { user: true }
    });

    if (!signedTimesheet) {
      return NextResponse.json(
        { error: 'Token de signature invalide' },
        { status: 400 }
      );
    }

    if (signedTimesheet.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Token de signature expiré' },
        { status: 400 }
      );
    }

    if (signedTimesheet.signatureStatus !== 'PENDING') {
      return NextResponse.json(
        { error: 'Cette feuille de temps a déjà été signée' },
        { status: 400 }
      );
    }

    // TOUJOURS utiliser notre générateur personnalisé avec signature
    console.log('🔄 Utilisation du générateur PDF personnalisé...');
    const { generateTimesheetPDFWithPDFMaker } = await import('@/lib/pdf-maker-generator');
    
    // Récupérer les données complètes pour générer le PDF
    console.log('📊 Récupération des données de la feuille de temps...');
    const userProformaCost = await prisma.userProformaCost.findUnique({
      where: {
        userId_year: {
          userId: signedTimesheet.userId,
          year: signedTimesheet.year
        }
      }
    });
    
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        userId: signedTimesheet.userId,
        year: signedTimesheet.year,
        semester: signedTimesheet.semester
      },
      include: {
        project: true,
        activity: true
      }
    });

    console.log(`📋 ${timeEntries.length} entrées de temps trouvées`);

    // Calculer les totaux
    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const totalCalculatedCost = timeEntries.reduce((sum, entry) => {
      const hourlyCost = userProformaCost?.cost ? userProformaCost.cost / 960 : 0;
      return sum + (entry.hours * hourlyCost);
    }, 0);

    console.log(`💰 Total: ${totalHours}h, Coût: ${totalCalculatedCost} USD`);

    // Préparer les données pour la génération PDF avec signature
    const timesheetData = {
      userName: signedTimesheet.user.name,
      userGrade: signedTimesheet.user.grade,
      userProformaCost: userProformaCost?.cost || 0,
      totalHours,
      totalCalculatedCost,
      year: signedTimesheet.year,
      semester: signedTimesheet.semester,
      timeEntries: timeEntries.map(entry => ({
        projectName: entry.project.name,
        activityName: entry.activity.name,
        hours: entry.hours,
        cost: userProformaCost?.cost ? (entry.hours * userProformaCost.cost / 960) : 0
      })),
      signatureInfo: {
        signedBy: signedTimesheet.user.name,
        signedAt: new Date(),
        signatureToken: signatureToken
      }
    };

    // Générer le PDF avec signature
    console.log('🎨 Génération du PDF avec design personnalisé...');
    const pdfUint8Array = await generateTimesheetPDFWithPDFMaker(timesheetData);
    const pdfBuffer = Buffer.from(pdfUint8Array);
    console.log(`✅ PDF généré: ${pdfBuffer.length} bytes`);

    // Mettre à jour le statut et sauvegarder le PDF signé
    await prisma.signedTimesheet.update({
      where: { signatureToken },
      data: {
        signedPdfData: pdfBuffer,
        signatureStatus: 'SIGNED',
        signatureDate: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Feuille de temps signée avec succès !',
      signedAt: new Date(),
      userId: signedTimesheet.userId,
      userName: signedTimesheet.user.name,
      year: signedTimesheet.year,
      semester: signedTimesheet.semester
    });

  } catch (error) {
    console.error('Erreur lors de la signature:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la signature' },
      { status: 500 }
    );
  }
}
