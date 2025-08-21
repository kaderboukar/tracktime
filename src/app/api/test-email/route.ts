import { NextRequest, NextResponse } from "next/server";
import { restrictTo } from "@/lib/auth";
import { testEmailConfiguration, sendWelcomeEmail, sendTimeEntryNotification, getApplicationUrl } from "@/lib/email";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

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
    let emailResults = [];

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

      case "bulk-import":
        // Test d'import de masse avec envoi d'emails
        const testUsers = [
          {
            email: "test1@example.com",
            password: "MotDePasse123",
            name: "Utilisateur Test 1",
            indice: "P1",
            grade: "G1",
            type: "OPERATION",
            role: "STAFF",
            proformaCosts: [{ year: 2024, cost: 50000 }]
          },
          {
            email: "test2@example.com",
            password: "MotDePasse456",
            name: "Utilisateur Test 2",
            indice: "P2",
            grade: "G2",
            type: "PROGRAMME",
            role: "MANAGEMENT",
            proformaCosts: [{ year: 2024, cost: 60000 }]
          },
          {
            email: "test3@example.com",
            password: "MotDePasse789",
            name: "Utilisateur Test 3",
            indice: "P3",
            grade: "G3",
            type: "SUPPORT",
            role: "ADMIN",
            proformaCosts: [{ year: 2024, cost: 70000 }]
          }
        ];

        const importResults = [];
        const emailResults = [];

        for (const [index, userData] of testUsers.entries()) {
          try {
            // Vérifier si l'utilisateur existe déjà
            const existingUser = await prisma.user.findUnique({
              where: { email: userData.email }
            });

            if (existingUser) {
              importResults.push({
                row: index + 1,
                email: userData.email,
                status: "SKIPPED",
                message: "Utilisateur déjà existant"
              });
              continue;
            }

            // Créer l'utilisateur
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const user = await prisma.$transaction(async (tx) => {
              const newUser = await tx.user.create({
                data: {
                  email: userData.email,
                  password: hashedPassword,
                  name: userData.name,
                  indice: userData.indice,
                  grade: userData.grade,
                  type: userData.type,
                  role: userData.role,
                  isActive: true,
                  signature: "",
                }
              });

              // Créer les coûts proforma
              if (userData.proformaCosts && Array.isArray(userData.proformaCosts)) {
                await tx.userProformaCost.createMany({
                  data: userData.proformaCosts.map((cost: { year: number; cost: number }) => ({
                    userId: newUser.id,
                    year: cost.year,
                    cost: cost.cost
                  }))
                });
              }

              return newUser;
            });

            // Envoyer l'email de bienvenue
            try {
              const emailResult = await sendWelcomeEmail({
                name: user.name,
                email: user.email,
                password: userData.password,
                role: user.role
              });

              emailResults.push({
                email: user.email,
                status: emailResult ? "SENT" : "FAILED",
                message: emailResult ? "Email envoyé avec succès" : "Échec de l'envoi"
              });
            } catch (emailError) {
              emailResults.push({
                email: user.email,
                status: "FAILED",
                message: `Erreur email: ${(emailError as Error).message}`
              });
            }

            importResults.push({
              row: index + 1,
              email: user.email,
              status: "CREATED",
              message: "Utilisateur créé avec succès"
            });

          } catch (error) {
            importResults.push({
              row: index + 1,
              email: userData.email,
              status: "ERROR",
              message: `Erreur: ${(error as Error).message}`
            });
          }
        }

        const successfulImports = importResults.filter(r => r.status === "CREATED").length;
        const successfulEmails = emailResults.filter(r => r.status === "SENT").length;

        return NextResponse.json({
          success: true,
          message: `Test d'import de masse terminé: ${successfulImports} utilisateurs créés, ${successfulEmails} emails envoyés`,
          importResults,
          emailResults,
          summary: {
            total: testUsers.length,
            created: successfulImports,
            emailsSent: successfulEmails,
            skipped: importResults.filter(r => r.status === "SKIPPED").length,
            errors: importResults.filter(r => r.status === "ERROR").length
          }
        });

      default:
        return NextResponse.json(
          { success: false, message: "Type de test invalide. Utilisez 'welcome', 'timeentry' ou 'bulk-import'" },
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
      appUrl: getApplicationUrl(),
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        from: process.env.SMTP_FROM,
        notificationEmails: process.env.TIME_ENTRY_NOTIFICATION_EMAILS?.split(',').map(email => email.trim()) || []
      },
      environment: {
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        VERCEL_URL: process.env.VERCEL_URL,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL
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
