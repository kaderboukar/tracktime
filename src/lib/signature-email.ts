import nodemailer from 'nodemailer';

// Configuration du transporteur email
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

// Fonction utilitaire pour obtenir l'URL de l'application
const getAppUrl = (): string => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  return 'http://localhost:3000';
};

// Interface pour l'email de signature
interface TimesheetSignatureData {
  userName: string;
  userEmail: string;
  year: number;
  semester: string;
  totalHours: number;
  totalCalculatedCost: number;
  signatureToken: string;
  pdfBuffer?: ArrayBuffer;
}

// Fonction pour envoyer l'email de signature avec PDF et lien de signature
export async function sendTimesheetSignatureEmail(timesheetData: TimesheetSignatureData): Promise<boolean> {
  try {
    const appUrl = getAppUrl();
    const signatureUrl = `${appUrl}/timesheet/sign?token=${timesheetData.signatureToken}`;

    // Template HTML pour l'email de signature
    const getSignatureEmailTemplate = (userName: string, year: number, semester: string, totalHours: number, totalCost: number, signatureUrl: string) => `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Feuille de Temps - Signature Électronique Requise</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #0d9488; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background-color: #f9f9f9; }
              .highlight { background-color: #e6fffa; padding: 15px; border-left: 4px solid #0d9488; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
              .button { display: inline-block; padding: 15px 30px; background-color: #0d9488; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; }
              .stats { background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>WORKLOAD STUDY SURVEY</h1>
                  <h2>Feuille de Temps - Signature Électronique</h2>
              </div>
              <div class="content">
                  <p>Bonjour <strong>${userName}</strong>,</p>
                  
                  <div class="highlight">
                      <p><strong>Votre feuille de temps pour ${year} ${semester} est prête pour signature électronique.</strong></p>
                      <p>Le document PDF est joint à cet email.</p>
                  </div>
                  
                  <div class="stats">
                      <h3>Résumé de la période :</h3>
                      <p><strong>Période :</strong> ${year} - ${semester}</p>
                      <p><strong>Total des heures :</strong> ${totalHours}h</p>
                      <p><strong>Coût calculé :</strong> ${totalCost.toLocaleString('fr-FR')} USD</p>
                  </div>
                  
                  <h3>Instructions de signature :</h3>
                  <ol>
                      <li><strong>Téléchargez le PDF joint</strong> à cet email</li>
                      <li><strong>Vérifiez les informations</strong> contenues dans le document</li>
                      <li><strong>Cliquez sur le bouton ci-dessous</strong> pour accéder à la signature électronique</li>
                      <li><strong>Signez électroniquement</strong> le document</li>
                  </ol>
                  
                  <div style="text-align: center; margin: 30px 0;">
                      <a href="${signatureUrl}" class="button">
                          ✍️ Signer Électroniquement
                      </a>
                  </div>
                  
                  <p><strong>Important :</strong> Ce lien de signature expire dans 7 jours.</p>
                  
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
      to: timesheetData.userEmail,
      subject: `Feuille de temps ${timesheetData.year} ${timesheetData.semester} - Signature électronique requise pour ${timesheetData.userName}`,
      html: getSignatureEmailTemplate(
        timesheetData.userName, 
        timesheetData.year, 
        timesheetData.semester, 
        timesheetData.totalHours, 
        timesheetData.totalCalculatedCost, 
        signatureUrl
      ),
      attachments: timesheetData.pdfBuffer ? [
        {
          filename: `feuille_temps_${timesheetData.userName}_${timesheetData.year}_${timesheetData.semester}.pdf`,
          content: Buffer.from(timesheetData.pdfBuffer),
          contentType: 'application/pdf'
        }
      ] : []
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email de signature envoyé avec succès pour ${timesheetData.userName}`);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de signature:', error);
    return false;
  }
}
