import { NextRequest, NextResponse } from "next/server";
import { restrictTo } from "@/lib/auth";
import { testEmailConfiguration, sendWelcomeEmail, sendTimeEntryNotification } from "@/lib/email";

export async function POST(req: NextRequest) {
  // Seuls les admins peuvent tester la configuration email
  const authError = await restrictTo(req, "ADMIN");
  if (authError) return authError;

  try {
    const body = await req.json();
    const { type, testData } = body;

    // Tester la configuration email
    const isConfigValid = await testEmailConfiguration();
    if (!isConfigValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Configuration email invalide. Vérifiez les paramètres SMTP."
        },
        { status: 500 }
      );
    }

    let result = false;
    let message = "";

    switch (type) {
      case "welcome":
        if (!testData?.email || !testData?.name) {
          return NextResponse.json(
            { success: false, message: "Email et nom requis pour le test d'email de bienvenue" },
            { status: 400 }
          );
        }

        result = await sendWelcomeEmail({
          name: testData.name,
          email: testData.email,
          password: "MotDePasseTest123",
          role: testData.role || "STAFF"
        });
        message = result ? "Email de bienvenue envoyé avec succès" : "Échec de l'envoi de l'email de bienvenue";
        break;

      case "timeentry":
        if (!testData?.email || !testData?.userName) {
          return NextResponse.json(
            { success: false, message: "Email et nom d'utilisateur requis pour le test de notification" },
            { status: 400 }
          );
        }

        result = await sendTimeEntryNotification({
          userName: testData.userName,
          userEmail: testData.email,
          projectName: testData.projectName || "Projet Test",
          activityName: testData.activityName || "Activité Test",
          hours: testData.hours || 8,
          date: new Date().toLocaleDateString('fr-FR'),
          semester: testData.semester || "S1",
          year: testData.year || new Date().getFullYear(),
          description: testData.description || "Ceci est un test de notification d'entrée de temps"
        });
        message = result ? "Notification d'entrée de temps envoyée avec succès" : "Échec de l'envoi de la notification";
        break;

      default:
        return NextResponse.json(
          { success: false, message: "Type de test invalide. Utilisez 'welcome' ou 'timeentry'" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: result,
      message,
      configValid: isConfigValid
    });

  } catch (error) {
    console.error("Erreur lors du test email:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors du test email",
        error: process.env.NODE_ENV === "development" ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Seuls les admins peuvent vérifier la configuration email
  const authError = await restrictTo(req, "ADMIN");
  if (authError) return authError;

  try {
    const isConfigValid = await testEmailConfiguration();

    return NextResponse.json({
      success: true,
      configValid: isConfigValid,
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        from: process.env.SMTP_FROM,
        notificationEmails: process.env.TIME_ENTRY_NOTIFICATION_EMAILS?.split(',').map(email => email.trim()) || []
      }
    });

  } catch (error) {
    console.error("Erreur lors de la vérification de la configuration email:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de la vérification de la configuration email",
        error: process.env.NODE_ENV === "development" ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}
