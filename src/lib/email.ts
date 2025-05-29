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
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" class="button">
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
