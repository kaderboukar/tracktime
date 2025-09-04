import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";

// Fonction pour authentifier via token de signature
async function authenticateViaSignatureToken(signatureToken: string) {
  try {
    const signedTimesheet = await prisma.signedTimesheet.findUnique({
      where: { signatureToken },
      include: { user: true }
    });

    if (!signedTimesheet) {
      return null;
    }

    if (signedTimesheet.expiresAt < new Date()) {
      return null;
    }

    return {
      userId: signedTimesheet.userId,
      role: signedTimesheet.user.role,
      signatureToken: signedTimesheet
    };
  } catch (error) {
    console.error("Erreur lors de l'authentification via token de signature:", error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const signatureToken = searchParams.get('token');

    if (!signatureToken) {
      return NextResponse.json(
        { success: false, message: "Token de signature requis" },
        { status: 400 }
      );
    }

    // Essayer d'abord l'authentification JWT standard
    let authResult = await authenticate(request);
    
    // Si l'authentification JWT échoue, essayer avec le token de signature
    if (authResult instanceof NextResponse) {
      if (authResult.status === 401) {
        const signatureAuth = await authenticateViaSignatureToken(signatureToken);
        if (signatureAuth) {
          authResult = signatureAuth;
        } else {
          return NextResponse.json(
            { success: false, message: "Token de signature invalide ou expiré" },
            { status: 401 }
          );
        }
      } else {
        return authResult;
      }
    }

    // Récupérer les informations de la feuille de temps
    const signedTimesheet = await prisma.signedTimesheet.findUnique({
      where: { signatureToken },
      include: { user: true }
    });

    if (!signedTimesheet) {
      return NextResponse.json(
        { success: false, message: "Token de signature invalide" },
        { status: 400 }
      );
    }

    if (signedTimesheet.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, message: "Token de signature expiré" },
        { status: 400 }
      );
    }

    // ✅ GÉNÉRER LE PDF ORIGINAL COMPLET
    const { generateTimesheetPDF } = await import('@/lib/pdf-maker-generator');
    
    // Récupérer le proformaCost de l'utilisateur pour cette année
    const userProformaCost = await prisma.userProformaCost.findUnique({
      where: {
        userId_year: {
          userId: signedTimesheet.userId,
          year: signedTimesheet.year
        }
      }
    });
    
    // Récupérer les données de temps pour cette période
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

    // Calculer les totaux
    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const totalCalculatedCost = timeEntries.reduce((sum, entry) => {
      const hourlyCost = userProformaCost?.cost ? userProformaCost.cost / 960 : 0;
      return sum + (entry.hours * hourlyCost);
    }, 0);

    // Préparer les données pour la génération PDF
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
      }))
    };

    // Générer le PDF original
    const pdfBuffer = await generateTimesheetPDF(timesheetData);

    // Retourner le PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="feuille_temps_${signedTimesheet.user.name}_${signedTimesheet.year}_${signedTimesheet.semester}.pdf"`
      }
    });

  } catch (error) {
    console.error("Erreur lors de la récupération du PDF original:", error);
    return NextResponse.json(
      { success: false, message: "Erreur lors de la récupération du PDF" },
      { status: 500 }
    );
  }
}
