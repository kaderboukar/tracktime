import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import {
  getFirstReminderEmail,
  getSecondReminderEmail,
  getThirdReminderEmail,
  getFinalReminderEmail,
  getManagementAlertEmail,
  AlertEmailData,
  ManagementAlertData
} from "@/lib/email-templates";
import { EMAIL_BULK_CONFIG, getAdaptiveDelays, ALERT_THRESHOLDS } from "@/lib/email-config";

// Configuration des alertes
const ALERT_CONFIG = {
  firstReminderDays: 3,        // Premier rappel après 3 jours
  secondReminderDays: 7,       // Deuxième rappel après 7 jours
  thirdReminderDays: 14,       // Troisième rappel après 14 jours
  finalReminderDays: 21,       // Dernier rappel après 21 jours
  managementEmails: ['management@undp.org'], // À configurer selon vos besoins
};

// Fonction utilitaire pour attendre
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Fonction pour envoyer un email avec retry et timeout
async function sendEmailWithRetry(
  emailData: AlertEmailData,
  emailTemplate: { subject: string; html: string },
  userEmail: string,
  maxRetries: number = EMAIL_BULK_CONFIG.maxRetries
): Promise<{ success: boolean; error?: string; timeTaken: number }> {
  const startTime = Date.now();
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Timeout pour chaque tentative d'envoi
      const emailPromise = sendEmail({
        to: userEmail,
        subject: emailTemplate.subject,
        html: emailTemplate.html
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), EMAIL_BULK_CONFIG.emailTimeout)
      );
      
      await Promise.race([emailPromise, timeoutPromise]);
      
      const timeTaken = Date.now() - startTime;
      return { success: true, timeTaken };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error(`Tentative ${attempt}/${maxRetries} échouée pour ${userEmail}:`, errorMessage);
      
      if (attempt < maxRetries) {
        console.log(`Nouvelle tentative dans ${EMAIL_BULK_CONFIG.retryDelay}ms...`);
        await delay(EMAIL_BULK_CONFIG.retryDelay);
      } else {
        const timeTaken = Date.now() - startTime;
        return { success: false, error: errorMessage, timeTaken };
      }
    }
  }
  
  const timeTaken = Date.now() - startTime;
  return { success: false, error: 'Nombre maximum de tentatives atteint', timeTaken };
}

// Fonction pour envoyer les emails par batch avec métriques
async function sendEmailsInBatches(
  usersToAlert: any[],
  alertType: string,
  activePeriod: any,
  daysSinceActivation: number
): Promise<{ sentAlerts: any[]; failedEmails: any[]; metrics: any }> {
  const sentAlerts = [];
  const failedEmails = [];
  const startTime = Date.now();
  let totalTimeTaken = 0;
  
  // Configuration adaptative selon le volume
  const adaptiveConfig = getAdaptiveDelays(usersToAlert.length);
  
  console.log(`🚀 Début de l'envoi des alertes par batch. Total: ${usersToAlert.length} utilisateurs`);
  console.log(`⚙️ Configuration: batchSize=${adaptiveConfig.batchSize}, délai entre batches=${adaptiveConfig.delayBetweenBatches}ms`);
  
  // Traiter par batches
  for (let i = 0; i < usersToAlert.length; i += adaptiveConfig.batchSize) {
    const batch = usersToAlert.slice(i, i + adaptiveConfig.batchSize);
    const batchNumber = Math.floor(i / adaptiveConfig.batchSize) + 1;
    const totalBatches = Math.ceil(usersToAlert.length / adaptiveConfig.batchSize);
    const batchStartTime = Date.now();
    
    console.log(`📦 Traitement du batch ${batchNumber}/${totalBatches} (${batch.length} utilisateurs)`);
    
    // Traiter chaque utilisateur du batch
    for (const user of batch) {
      try {
        const emailData: AlertEmailData = {
          userName: user.name,
          userEmail: user.email,
          year: activePeriod.year,
          semester: activePeriod.semester,
          daysSinceActivation,
          periodName: `${activePeriod.year} - ${activePeriod.semester}`
        };

        let emailTemplate;
        switch (alertType) {
          case 'FIRST_REMINDER':
            emailTemplate = getFirstReminderEmail(emailData);
            break;
          case 'SECOND_REMINDER':
            emailTemplate = getSecondReminderEmail(emailData);
            break;
          case 'THIRD_REMINDER':
            emailTemplate = getThirdReminderEmail(emailData);
            break;
          case 'FINAL_REMINDER':
            emailTemplate = getFinalReminderEmail(emailData);
            break;
        }

        // Envoyer l'email avec retry et timeout
        const result = await sendEmailWithRetry(emailData, emailTemplate, user.email);
        totalTimeTaken += result.timeTaken;
        
        if (result.success) {
          // Enregistrer l'alerte en base
          await prisma.timeEntryAlert.create({
            data: {
              userId: user.id,
              timePeriodId: activePeriod.id,
              alertType,
              daysSinceActivation,
              emailSent: true
            }
          });

          sentAlerts.push({
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            alertType,
            timeTaken: result.timeTaken
          });

          console.log(`✅ Alerte ${alertType} envoyée à ${user.name} (${user.email}) - ${result.timeTaken}ms`);
        } else {
          failedEmails.push({
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            alertType,
            reason: result.error,
            timeTaken: result.timeTaken
          });
          console.log(`❌ Échec de l'envoi de l'alerte à ${user.name} (${user.email}) - ${result.error}`);
        }

        // Délai entre chaque email du batch
        if (batch.indexOf(user) < batch.length - 1) {
          await delay(adaptiveConfig.delayBetweenEmails);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        console.error(`Erreur lors du traitement de ${user.email}:`, errorMessage);
        failedEmails.push({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          alertType,
          reason: `Erreur: ${errorMessage}`,
          timeTaken: 0
        });
      }
    }
    
    const batchTime = Date.now() - batchStartTime;
    console.log(`⏱️ Batch ${batchNumber} terminé en ${batchTime}ms`);
    
    // Délai entre les batches (sauf pour le dernier)
    if (batchNumber < totalBatches) {
      console.log(`⏳ Attente de ${adaptiveConfig.delayBetweenBatches}ms avant le prochain batch...`);
      await delay(adaptiveConfig.delayBetweenBatches);
    }
  }
  
  const totalTime = Date.now() - startTime;
  const successRate = usersToAlert.length > 0 ? Math.round((sentAlerts.length / usersToAlert.length) * 100) : 0;
  const averageTimePerEmail = sentAlerts.length > 0 ? Math.round(totalTimeTaken / sentAlerts.length) : 0;
  
  // Métriques de performance
  const metrics = {
    totalEmails: usersToAlert.length,
    successfulEmails: sentAlerts.length,
    failedEmails: failedEmails.length,
    successRate,
    averageTimePerEmail,
    totalTime,
    averageTimePerBatch: Math.round(totalTime / Math.ceil(usersToAlert.length / adaptiveConfig.batchSize))
  };
  
  // Vérification des seuils d'alerte
  if (successRate < ALERT_THRESHOLDS.criticalSuccessRate) {
    console.warn(`🚨 TAUX DE SUCCÈS CRITIQUE: ${successRate}% (seuil: ${ALERT_THRESHOLDS.criticalSuccessRate}%)`);
  } else if (successRate < ALERT_THRESHOLDS.warningSuccessRate) {
    console.warn(`⚠️ TAUX DE SUCCÈS FAIBLE: ${successRate}% (seuil: ${ALERT_THRESHOLDS.warningSuccessRate}%)`);
  }
  
  if (failedEmails.length > ALERT_THRESHOLDS.maxFailedEmails) {
    console.warn(`🚨 NOMBRE D'ÉCHECS ÉLEVÉ: ${failedEmails.length} (seuil: ${ALERT_THRESHOLDS.maxFailedEmails})`);
  }
  
  console.log(`✅ Envoi terminé en ${totalTime}ms`);
  console.log(`📊 Métriques: Succès: ${sentAlerts.length}, Échecs: ${failedEmails.length}, Taux: ${successRate}%`);
  
  return { sentAlerts, failedEmails, metrics };
}

export async function POST(request: NextRequest) {
  try {
    // Authentification
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { role } = authResult;
    if (role !== "ADMIN" && role !== "PMSU") {
      return NextResponse.json(
        { success: false, message: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Récupérer la période active
    const activePeriod = await prisma.timePeriod.findFirst({
      where: { isActive: true }
    });

    if (!activePeriod) {
      return NextResponse.json({
        success: false,
        message: "Aucune période active trouvée"
      });
    }

    // Calculer le nombre de jours depuis l'activation
    const activationDate = activePeriod.createdAt;
    const daysSinceActivation = Math.floor(
      (new Date().getTime() - activationDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    console.log(`Vérification des alertes - Jour ${daysSinceActivation} depuis l'activation`);

    // Vérifier si on doit envoyer des alertes aujourd'hui
    const alertThresholds = [
      ALERT_CONFIG.firstReminderDays,
      ALERT_CONFIG.secondReminderDays,
      ALERT_CONFIG.thirdReminderDays,
      ALERT_CONFIG.finalReminderDays
    ];

    if (!alertThresholds.includes(daysSinceActivation)) {
      return NextResponse.json({
        success: true,
        message: `Aucune alerte à envoyer aujourd'hui (jour ${daysSinceActivation})`,
        data: {
          daysSinceActivation,
          nextAlertDay: alertThresholds.find(day => day > daysSinceActivation) || null
        }
      });
    }

    // Identifier les utilisateurs STAFF sans entrées de temps
    const staffWithoutEntries = await prisma.user.findMany({
      where: {
        role: "STAFF",
        isActive: true,
        timeEntries: {
          none: {
            timePeriodId: activePeriod.id
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        grade: true,
        timeEntryAlerts: {
          where: {
            timePeriodId: activePeriod.id
          }
        }
      }
    });

    console.log(`${staffWithoutEntries.length} utilisateurs STAFF sans entrées de temps`);

    if (staffWithoutEntries.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Tous les utilisateurs STAFF ont saisi leurs entrées de temps",
        data: {
          daysSinceActivation,
          staffWithoutEntries: 0
        }
      });
    }

    // Déterminer le type d'alerte à envoyer
    let alertType: 'FIRST_REMINDER' | 'SECOND_REMINDER' | 'THIRD_REMINDER' | 'FINAL_REMINDER';
    let shouldCopyManagement = false;
    let shouldEscalateManagement = false;

    switch (daysSinceActivation) {
      case ALERT_CONFIG.firstReminderDays:
        alertType = 'FIRST_REMINDER';
        break;
      case ALERT_CONFIG.secondReminderDays:
        alertType = 'SECOND_REMINDER';
        shouldCopyManagement = true;
        break;
      case ALERT_CONFIG.thirdReminderDays:
        alertType = 'THIRD_REMINDER';
        shouldCopyManagement = true;
        break;
      case ALERT_CONFIG.finalReminderDays:
        alertType = 'FINAL_REMINDER';
        shouldEscalateManagement = true;
        break;
      default:
        return NextResponse.json({
          success: false,
          message: "Jour d'alerte non reconnu"
        });
    }

    // Filtrer les utilisateurs qui n'ont pas encore reçu cette alerte
    const usersToAlert = staffWithoutEntries.filter(user => 
      !user.timeEntryAlerts.some(alert => alert.alertType === alertType)
    );

    console.log(`${usersToAlert.length} utilisateurs à alerter pour ${alertType}`);

    // Envoyer les alertes aux utilisateurs STAFF
    const { sentAlerts, failedEmails, metrics } = await sendEmailsInBatches(usersToAlert, alertType, activePeriod, daysSinceActivation);

    // Envoyer l'email au management si nécessaire
    let managementEmailSent = false;
    if (shouldCopyManagement || shouldEscalateManagement) {
      try {
        const managementData: ManagementAlertData = {
          staffList: usersToAlert.map(user => ({
            name: user.name,
            email: user.email,
            grade: user.grade
          })),
          year: activePeriod.year,
          semester: activePeriod.semester,
          daysSinceActivation,
          totalStaff: usersToAlert.length,
          complianceRate: 0 // À calculer si nécessaire
        };

        const managementEmailTemplate = getManagementAlertEmail(managementData);

        // Envoyer à tous les emails du management
        for (const managementEmailAddress of ALERT_CONFIG.managementEmails) {
          await sendEmail({
            to: managementEmailAddress,
            subject: managementEmailTemplate.subject,
            html: managementEmailTemplate.html
          });
        }

        managementEmailSent = true;
        console.log(`Email management envoyé à ${ALERT_CONFIG.managementEmails.join(', ')}`);

      } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email management:', error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Alertes envoyées avec succès`,
      data: {
        daysSinceActivation,
        alertType,
        sentAlerts,
        managementEmailSent,
        totalStaffWithoutEntries: staffWithoutEntries.length,
        totalAlertsSent: sentAlerts.length,
        metrics // Ajout des métriques de performance
      }
    });

  } catch (error) {
    console.error("Erreur lors de la vérification des alertes:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur lors de la vérification des alertes",
        error: process.env.NODE_ENV === "development" ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}

// Endpoint GET pour obtenir le statut des alertes
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { role } = authResult;
    if (role !== "ADMIN" && role !== "PMSU") {
      return NextResponse.json(
        { success: false, message: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Récupérer la période active
    const activePeriod = await prisma.timePeriod.findFirst({
      where: { isActive: true }
    });

    if (!activePeriod) {
      return NextResponse.json({
        success: false,
        message: "Aucune période active trouvée"
      });
    }

    // Calculer le nombre de jours depuis l'activation
    const daysSinceActivation = Math.floor(
      (new Date().getTime() - activePeriod.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Statistiques des alertes
    const alertStats = await prisma.timeEntryAlert.groupBy({
      by: ['alertType'],
      where: {
        timePeriodId: activePeriod.id
      },
      _count: {
        id: true
      }
    });

    // Utilisateurs sans entrées
    const staffWithoutEntries = await prisma.user.count({
      where: {
        role: "STAFF",
        isActive: true,
        timeEntries: {
          none: {
            timePeriodId: activePeriod.id
          }
        }
      }
    });

    // Total des utilisateurs STAFF
    const totalStaff = await prisma.user.count({
      where: {
        role: "STAFF",
        isActive: true
      }
    });

    const complianceRate = totalStaff > 0 ? Math.round(((totalStaff - staffWithoutEntries) / totalStaff) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        activePeriod: {
          year: activePeriod.year,
          semester: activePeriod.semester,
          activatedAt: activePeriod.createdAt
        },
        daysSinceActivation,
        alertStats,
        staffWithoutEntries,
        totalStaff,
        complianceRate,
        nextAlertDay: [3, 7, 14, 21].find(day => day > daysSinceActivation) || null
      }
    });

  } catch (error) {
    console.error("Erreur lors de la récupération du statut des alertes:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur",
        error: process.env.NODE_ENV === "development" ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}
