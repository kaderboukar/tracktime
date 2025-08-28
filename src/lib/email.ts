import nodemailer from 'nodemailer';

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true pour 465, false pour autres ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Fonction utilitaire pour formater l'expéditeur avec le nom d'affichage
const getFormattedSender = (): string => {
  return `"WORKLOAD STUDY SURVEY" <${process.env.SMTP_FROM}>`;
};

// Fonction utilitaire pour obtenir l'URL de l'application
const getAppUrl = (): string => {
  // Priorité 1: Variable d'environnement NEXT_PUBLIC_APP_URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // Priorité 2: Variable d'environnement VERCEL_URL (pour Vercel)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Priorité 3: Variable d'environnement NEXTAUTH_URL
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  
  // Fallback: localhost pour le développement
  return 'http://localhost:3000';
};

// Fonction exportée pour tester la détection de l'URL
export const getApplicationUrl = (): string => {
  return getAppUrl();
};

// Interface pour les données utilisateur
interface UserData {
  name: string;
  email: string;
  password: string;
  role: string;
}

// Interface pour les données d'entrée de temps
interface TimeEntryData {
  userName: string;
  userEmail: string;
  projectName: string;
  activityName: string;
  hours: number;
  date: string;
  semester: string;
  year: number;
  description?: string;
}

// Interface pour l'email de signature de feuille de temps
interface TimesheetSignatureData {
  userName: string;
  userEmail: string;
  year: number;
  semester: string;
  totalHours: number;
  totalCalculatedCost: number;
  signatureToken: string;
  pdfBuffer?: ArrayBuffer; // PDF en pièce jointe
}

// Template HTML pour l'email de bienvenue
const getWelcomeEmailTemplate = (userData: UserData) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Bienvenue dans le système de suivi du temps</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0d9488; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .credentials { background-color: #e6fffa; padding: 15px; border-left: 4px solid #0d9488; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .button { display: inline-block; padding: 10px 20px; background-color: #0d9488; color: white; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>WORKLOAD STUDY SURVEY</h1>
            <h2>Bienvenue dans le système de suivi du temps</h2>
        </div>
        <div class="content">
            <h2>Bonjour ${userData.name},</h2>
            <p>Votre compte a été créé avec succès dans notre système de suivi du temps WORKLOAD STUDY SURVEY.</p>

            <div class="credentials">
                <h3>Vos informations de connexion :</h3>
                <p><strong>Email :</strong> ${userData.email}</p>
                <p><strong>Mot de passe :</strong> ${userData.password}</p>
                <p><strong>Rôle :</strong> ${userData.role}</p>
            </div>

            <p>Pour des raisons de sécurité, nous vous recommandons de ne pas partager votre mot de passe.</p>

            <p style="text-align: center; margin: 30px 0;">
                <a href="${getAppUrl()}/login" class="button">
                    Se connecter
                </a>
            </p>

            <p>Si vous avez des questions, n'hésitez pas à contacter l'administrateur système.</p>
        </div>
        <div class="footer">
            <p>Cet email a été envoyé automatiquement par WORKLOAD STUDY SURVEY. Merci de ne pas répondre à ce message.</p>
        </div>
    </div>
</body>
</html>
`;

// Template HTML pour la notification d'entrée de temps
const getTimeEntryNotificationTemplate = (entryData: TimeEntryData) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Nouvelle entrée de temps</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .entry-details { background-color: #eff6ff; padding: 15px; border-left: 4px solid #1e40af; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .detail-row { margin: 8px 0; }
        .label { font-weight: bold; color: #1e40af; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>WORKLOAD STUDY SURVEY</h1>
            <h2>Nouvelle entrée de temps</h2>
        </div>
        <div class="content">
            <p>Une nouvelle entrée de temps a été créée dans le système WORKLOAD STUDY SURVEY.</p>

            <div class="entry-details">
                <h3>Détails de l'entrée :</h3>
                <div class="detail-row">
                    <span class="label">Utilisateur :</span> ${entryData.userName} (${entryData.userEmail})
                </div>
                <div class="detail-row">
                    <span class="label">Projet :</span> ${entryData.projectName}
                </div>
                <div class="detail-row">
                    <span class="label">Activité :</span> ${entryData.activityName}
                </div>
                <div class="detail-row">
                    <span class="label">Heures :</span> ${entryData.hours}h
                </div>
                <div class="detail-row">
                    <span class="label">Date :</span> ${entryData.date}
                </div>
                <div class="detail-row">
                    <span class="label">Période :</span> ${entryData.semester} ${entryData.year}
                </div>
                ${entryData.description ? `
                <div class="detail-row">
                    <span class="label">Description :</span> ${entryData.description}
                </div>
                ` : ''}
            </div>

            <p>Vous pouvez consulter et gérer cette entrée dans le système de suivi du temps WORKLOAD STUDY SURVEY.</p>
            
            <p style="text-align: center; margin: 30px 0;">
                <a href="${getAppUrl()}/" class="button">
                    Accéder au Dashboard
                </a>
            </p>
        </div>
        <div class="footer">
            <p>Cet email a été envoyé automatiquement par WORKLOAD STUDY SURVEY. Merci de ne pas répondre à ce message.</p>
        </div>
    </div>
</body>
</html>
`;

// Fonction pour envoyer l'email de bienvenue
export async function sendWelcomeEmail(userData: UserData): Promise<boolean> {
  try {
    const mailOptions = {
      from: getFormattedSender(),
      to: userData.email,
      subject: 'Bienvenue dans le système de suivi du temps - Vos informations de connexion',
      html: getWelcomeEmailTemplate(userData),
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email de bienvenue envoyé à ${userData.email}`);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de bienvenue:', error);
    return false;
  }
}

// Fonction pour envoyer la notification d'entrée de temps
export async function sendTimeEntryNotification(entryData: TimeEntryData): Promise<boolean> {
  try {
    const notificationEmails = process.env.TIME_ENTRY_NOTIFICATION_EMAILS?.split(',').map(email => email.trim()) || [];

    if (notificationEmails.length === 0) {
      console.log('Aucun destinataire configuré pour les notifications d\'entrées de temps');
      return true;
    }

    const mailOptions = {
      from: getFormattedSender(),
      to: notificationEmails,
      subject: `Nouvelle entrée de temps - ${entryData.userName} - ${entryData.projectName}`,
      html: getTimeEntryNotificationTemplate(entryData),
    };

    await transporter.sendMail(mailOptions);
    console.log(`Notification d'entrée de temps envoyée à ${notificationEmails.join(', ')}`);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification d\'entrée de temps:', error);
    return false;
  }
}

// Fonction pour tester la configuration email
export async function testEmailConfiguration(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('Configuration email valide');
    return true;
  } catch (error) {
    console.error('Erreur de configuration email:', error);
    return false;
  }
}

// Interface pour les données de feuille de temps
interface TimesheetData {
  userName: string;
  year: string;
  semester: string;
  pdfBuffer: ArrayBuffer;
}

// Fonction pour envoyer l'email de feuille de temps
export async function sendTimesheetEmail(timesheetData: TimesheetData): Promise<boolean> {
  try {
    // Tester d'abord la configuration
    const isConfigValid = await testEmailConfiguration();
    if (!isConfigValid) {
      console.error('Configuration email invalide pour l\'envoi de feuille de temps');
      return false;
    }

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
              .header { background-color: #0d9488; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background-color: #f9f9f9; }
              .highlight { background-color: #e6fffa; padding: 15px; border-left: 4px solid #0d9488; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
              .button { display: inline-block; padding: 10px 20px; background-color: #0d9488; color: white; text-decoration: none; border-radius: 5px; }
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
      to: process.env.SMTP_USER, // Pour le test, on envoie à l'admin
      subject: `Feuille de temps ${timesheetData.year} ${timesheetData.semester} - Signature requise pour ${timesheetData.userName}`,
      html: getTimesheetEmailTemplate(timesheetData.userName, timesheetData.year, timesheetData.semester),
      attachments: [
        {
          filename: `feuille_temps_${timesheetData.userName}_${timesheetData.year}_${timesheetData.semester}.pdf`,
          content: Buffer.from(timesheetData.pdfBuffer),
          contentType: 'application/pdf'
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email de feuille de temps envoyé avec succès pour ${timesheetData.userName}`);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de feuille de temps:', error);
    return false;
  }
}
