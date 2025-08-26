import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  const authResult = await authenticate(request);
  if (authResult instanceof NextResponse) return authResult;
  
  const { userId, year, semester } = await request.json();

  try {
    // Vérifier que l'utilisateur est ADMIN ou PMSU
    if (!['ADMIN', 'PMSU'].includes(authResult.role)) {
      return NextResponse.json(
        { success: false, message: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Récupérer toutes les entrées de temps du STAFF pour le semestre
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        userId: parseInt(userId),
        year: parseInt(year),
        semester: semester as "S1" | "S2",
      },
      include: {
        user: {
          include: {
            proformaCosts: {
              where: { year: parseInt(year) }
            }
          }
        },
        project: true,
        activity: true
      }
    });

    // Vérifier si toutes les entrées sont approuvées
    const totalEntries = timeEntries.length;
    const approvedEntries = timeEntries.filter(entry => entry.status === 'APPROVED').length;

    if (totalEntries === 0) {
      return NextResponse.json(
        { success: false, message: "Aucune entrée de temps trouvée pour cette période" },
        { status: 400 }
      );
    }

    if (approvedEntries !== totalEntries) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Toutes les entrées ne sont pas encore approuvées. ${approvedEntries}/${totalEntries} approuvées.` 
        },
        { status: 400 }
      );
    }

    // Calculer les statistiques pour la feuille de temps
    const staffUser = timeEntries[0].user;
    const proformaCost = staffUser.proformaCosts[0];
    
    if (!proformaCost) {
      return NextResponse.json(
        { success: false, message: "Coût proforma non trouvé pour cette année" },
        { status: 400 }
      );
    }

    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const semesterCost = proformaCost.cost / 2; // Coût semestriel
    const hourlyCost = semesterCost / 480; // 480 heures par semestre
    const totalCalculatedCost = totalHours * hourlyCost;

    // Préparer les données pour la feuille de temps
    const timesheetData = {
      userId: staffUser.id,
      userName: staffUser.name,
      userGrade: staffUser.grade,
      userProformaCost: proformaCost.cost,
      totalHours,
      semesterCost,
      hourlyCost,
      totalCalculatedCost,
      year: parseInt(year),
      semester,
      timeEntries: timeEntries.map(entry => ({
        projectName: entry.project.name,
        activityName: entry.activity.name,
        hours: entry.hours,
        cost: entry.hours * hourlyCost
      }))
    };

    // Générer le PDF
    const pdfBuffer = await generateTimesheetPDF(timesheetData);
    
    // Envoyer l'email avec le PDF
    const emailSent = await sendTimesheetEmail(staffUser.email, staffUser.name, pdfBuffer, year, semester);

    return NextResponse.json({
      success: true,
      message: emailSent 
        ? "Feuille de temps générée et envoyée avec succès" 
        : "Feuille de temps générée avec succès, mais l'envoi d'email a échoué",
      data: {
        userId: staffUser.id,
        userName: staffUser.name,
        totalEntries,
        approvedEntries,
        totalHours,
        totalCalculatedCost: Math.round(totalCalculatedCost),
        emailSent
      }
    });

  } catch (error) {
    console.error("Erreur lors de la génération automatique:", error);
    return NextResponse.json(
      { success: false, message: "Erreur lors de la génération automatique" },
      { status: 500 }
    );
  }
}

// Fonction pour générer le PDF de feuille de temps
async function generateTimesheetPDF(timesheetData: {
  userName: string;
  userGrade?: string;
  userProformaCost: number;
  totalHours: number;
  totalCalculatedCost: number;
  year: number;
  semester: string;
  timeEntries: Array<{
    projectName: string;
    activityName: string;
    hours: number;
    cost: number;
  }>;
}) {
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
  doc.text("FICHE DE TEMPS - STAFF", 148, 50, { align: "center" });

  // Informations de l'employé
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`Nom: ${timesheetData.userName}`, 20, 70);
  doc.text(`Grade: ${timesheetData.userGrade || "N/A"}`, 20, 75);
  doc.text(`Période: ${timesheetData.year} - ${timesheetData.semester}`, 20, 80);
  doc.text(`Coût Proforma Annuel: ${timesheetData.userProformaCost.toLocaleString('fr-FR')} USD`, 20, 85);

  // Préparer les données pour le tableau
  const tableData: string[][] = [];
  timesheetData.timeEntries.forEach((entry) => {
    tableData.push([
      entry.projectName,
      entry.activityName,
      `${entry.hours}h`,
      `${Math.round(entry.cost).toLocaleString('fr-FR')} USD`
    ]);
  });

  // Ajouter le tableau
  autoTable.default(doc, {
    startY: 100,
    head: [['Projet', 'Activité', 'Heures', 'Coût Calculé']],
    body: tableData,
    foot: [
      ['Total', '', `${timesheetData.totalHours}h`, `${Math.round(timesheetData.totalCalculatedCost).toLocaleString('fr-FR')} USD`]
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

  // Retourner le PDF comme buffer
  return doc.output('arraybuffer');
}

// Fonction pour envoyer l'email avec le PDF
async function sendTimesheetEmail(userEmail: string, userName: string, pdfBuffer: ArrayBuffer, year: string, semester: string) {
  try {
    const nodemailer = await import('nodemailer');
    
    // Configuration du transporteur email (utilise la même config que le système existant)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Fonction utilitaire pour formater l'expéditeur
    const getFormattedSender = (): string => {
      return `"WORKLOAD STUDY SURVEY" <${process.env.SMTP_FROM}>`;
    };

    // Template HTML pour l'email de feuille de temps
    const getTimesheetEmailTemplate = (userName: string, year: string, semester: string) => `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Feuille de Temps - Signature Requise</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
              .highlight { background: #e3f2fd; padding: 15px; border-left: 4px solid #2196f3; margin: 20px 0; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>WORKLOAD STUDY SURVEY</h1>
                  <h2>Feuille de Temps - Signature Requise</h2>
              </div>
              <div class="content">
                  <p>Bonjour <strong>${userName}</strong>,</p>
                  
                  <div class="highlight">
                      <p><strong>Votre feuille de temps pour ${year} ${semester} est prête pour signature.</strong></p>
                      <p>Le document PDF est joint à cet email.</p>
                  </div>
                  
                  <h3>Instructions :</h3>
                  <ol>
                      <li>Téléchargez le PDF joint</li>
                      <li>Vérifiez les informations contenues</li>
                      <li>Signez électroniquement le document</li>
                      <li>Retournez le document signé par email</li>
                  </ol>
                  
                  <p><strong>Important :</strong> Veuillez retourner le document signé dans les plus brefs délais.</p>
                  
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
      to: userEmail,
      subject: `Feuille de temps ${year} ${semester} - Signature requise`,
      html: getTimesheetEmailTemplate(userName, year, semester),
      attachments: [
        {
          filename: `feuille_temps_${userName}_${year}_${semester}.pdf`,
          content: Buffer.from(pdfBuffer),
          contentType: 'application/pdf'
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email de feuille de temps envoyé avec succès à ${userEmail} pour ${userName}`);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de feuille de temps:', error);
    return false;
  }
}
