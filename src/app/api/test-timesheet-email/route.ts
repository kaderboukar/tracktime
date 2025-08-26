import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const authResult = await authenticate(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    // Vérifier la configuration SMTP
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Tester la connexion SMTP
    await transporter.verify();

    // Récupérer un utilisateur STAFF de test
    const testUser = await prisma.user.findFirst({
      where: { role: 'STAFF' },
      include: {
        proformaCosts: {
          where: { year: 2025 }
        }
      }
    });

    if (!testUser) {
      return NextResponse.json({
        success: false,
        message: "Aucun utilisateur STAFF trouvé pour le test"
      });
    }

    return NextResponse.json({
      success: true,
      message: "Configuration SMTP valide",
      data: {
        smtp: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          user: process.env.SMTP_USER,
          from: process.env.SMTP_FROM
        },
        testUser: {
          id: testUser.id,
          name: testUser.name,
          email: testUser.email,
          role: testUser.role,
          hasProformaCost: testUser.proformaCosts.length > 0
        }
      }
    });

  } catch (error) {
    console.error("Erreur lors du test de configuration:", error);
    return NextResponse.json({
      success: false,
      message: "Erreur de configuration SMTP",
      error: (error as Error).message
    });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await authenticate(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { userId, year, semester } = await request.json();

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        proformaCosts: {
          where: { year: parseInt(year) }
        }
      }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    // Créer des données de test pour la feuille de temps
    const testTimeEntries = [
      {
        projectName: "Projet Test 1",
        activityName: "Développement",
        hours: 40,
        cost: 3200
      },
      {
        projectName: "Projet Test 2", 
        activityName: "Support",
        hours: 20,
        cost: 1600
      }
    ];

    const totalHours = testTimeEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const totalCost = testTimeEntries.reduce((sum, entry) => sum + entry.cost, 0);

    // Générer le PDF de test
    const jsPDF = (await import('jspdf')).default;
    const autoTable = await import('jspdf-autotable');
    
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Logo PNUD
    doc.addImage("/logoundp.png", "PNG", 250, 18, 25, 35);

    // En-tête
    doc.setFontSize(20);
    doc.setTextColor(66, 139, 202);
    doc.text("FICHE DE TEMPS - STAFF (TEST)", 148, 50, { align: "center" });

    // Informations de l'employé
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Nom: ${user.name}`, 20, 70);
    doc.text(`Grade: ${user.grade || "N/A"}`, 20, 75);
    doc.text(`Période: ${year} - ${semester}`, 20, 80);
    doc.text(`Coût Proforma Annuel: ${user.proformaCosts[0]?.cost || 0} USD`, 20, 85);

    // Préparer les données pour le tableau
    const tableData: string[][] = [];
    testTimeEntries.forEach((entry) => {
      tableData.push([
        entry.projectName,
        entry.activityName,
        `${entry.hours}h`,
        `${entry.cost.toLocaleString('fr-FR')} USD`
      ]);
    });

    // Ajouter le tableau
    autoTable.default(doc, {
      startY: 100,
      head: [['Projet', 'Activité', 'Heures', 'Coût Calculé']],
      body: tableData,
      foot: [
        ['Total', '', `${totalHours}h`, `${totalCost.toLocaleString('fr-FR')} USD`]
      ],
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold',
      },
      footStyles: {
        fillColor: [240, 240, 240],
        textColor: 0,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 75 },
        1: { cellWidth: 90 },
        2: { cellWidth: 35 },
        3: { cellWidth: 50 },
      },
      margin: { left: 20, right: 20 },
    });

    // Date et signature
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tableEndY = (doc as any).lastAutoTable?.finalY || 180;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageHeight = (doc as any).internal.pageSize.height;
    const signatureY = Math.max(tableEndY + 20, pageHeight - 30);

    doc.setFontSize(10);
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    doc.text(`Date: ${formattedDate}`, 20, signatureY);
    doc.text("Signature:", 200, signatureY);
    doc.line(200, signatureY + 5, 277, signatureY + 5);

    const pdfBuffer = doc.output('arraybuffer');

    // Envoyer l'email de test
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const getFormattedSender = (): string => {
      return `"WORKLOAD STUDY SURVEY" <${process.env.SMTP_FROM}>`;
    };

    const getTimesheetEmailTemplate = (userName: string, year: string, semester: string) => `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Feuille de Temps - Signature Requise (TEST)</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
              .highlight { background: #e3f2fd; padding: 15px; border-left: 4px solid #2196f3; margin: 20px 0; }
              .test-badge { background: #ff9800; color: white; padding: 5px 10px; border-radius: 15px; font-size: 12px; margin-bottom: 20px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <div class="test-badge">TEST</div>
                  <h1>WORKLOAD STUDY SURVEY</h1>
                  <h2>Feuille de Temps - Signature Requise</h2>
              </div>
              <div class="content">
                  <p>Bonjour <strong>${userName}</strong>,</p>
                  
                  <div class="highlight">
                      <p><strong>Ceci est un TEST de la fonctionnalité de génération automatique de feuille de temps.</strong></p>
                      <p>Votre feuille de temps pour ${year} ${semester} est prête pour signature.</p>
                      <p>Le document PDF est joint à cet email.</p>
                  </div>
                  
                  <h3>Instructions :</h3>
                  <ol>
                      <li>Téléchargez le PDF joint</li>
                      <li>Vérifiez les informations contenues</li>
                      <li>Signez électroniquement le document</li>
                      <li>Retournez le document signé par email</li>
                  </ol>
                  
                  <p><strong>Important :</strong> Ceci est un test. Veuillez retourner le document signé dans les plus brefs délais.</p>
                  
                  <p>Cordialement,<br>
                  <strong>L'équipe WORKLOAD STUDY SURVEY</strong></p>
              </div>
              <div class="footer">
                  <p>Cet email a été envoyé automatiquement par WORKLOAD STUDY SURVEY. Merci de ne pas répondre à ce message.</p>
              </div>
          </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: getFormattedSender(),
      to: user.email,
      subject: `[TEST] Feuille de temps ${year} ${semester} - Signature requise`,
      html: getTimesheetEmailTemplate(user.name, year, semester),
      attachments: [
        {
          filename: `feuille_temps_TEST_${user.name}_${year}_${semester}.pdf`,
          content: Buffer.from(pdfBuffer),
          contentType: 'application/pdf'
        }
      ]
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: "Email de test envoyé avec succès",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        period: `${year} ${semester}`,
        totalHours,
        totalCost
      }
    });

  } catch (error) {
    console.error("Erreur lors du test d'envoi:", error);
    return NextResponse.json({
      success: false,
      message: "Erreur lors du test d'envoi",
      error: (error as Error).message
    });
  }
}
