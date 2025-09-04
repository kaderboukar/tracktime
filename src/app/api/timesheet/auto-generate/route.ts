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

    // Créer un token de signature unique pour ce STAFF
    const signatureToken = Buffer.from(`${staffUser.id}-${year}-${semester}-${Date.now()}`).toString('base64');
    
    // Créer ou mettre à jour l'enregistrement SignedTimesheet
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Expire dans 7 jours
    
    await prisma.signedTimesheet.upsert({
      where: {
        userId_year_semester: {
          userId: staffUser.id,
          year: parseInt(year),
          semester: semester as "S1" | "S2"
        }
      },
      update: {
        originalPdfPath: `timesheets/${staffUser.id}_${year}_${semester}.pdf`,
        signatureToken,
        expiresAt,
        signatureStatus: 'PENDING',
        updatedAt: new Date()
      },
      create: {
        userId: staffUser.id,
        year: parseInt(year),
        semester: semester as "S1" | "S2",
        originalPdfPath: `timesheets/${staffUser.id}_${year}_${semester}.pdf`,
        signatureToken,
        expiresAt,
        signatureStatus: 'PENDING'
      }
    });
    
    // Générer le PDF
    console.log("🎨 Début de la génération du PDF...");
    const { generateTimesheetPDF } = await import('@/lib/pdf-maker-generator');
    console.log("📄 Générateur PDF importé avec succès");
    
    const pdfBuffer = await generateTimesheetPDF(timesheetData);
    console.log(`✅ PDF généré avec succès: ${pdfBuffer.length} bytes`);
    
    // Convertir Uint8Array en ArrayBuffer pour l'email
    console.log("🔄 Conversion du buffer PDF...");
    const pdfArrayBuffer = pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength) as ArrayBuffer;
    console.log(`✅ Buffer converti: ${pdfArrayBuffer.byteLength} bytes`);
    
    // Envoyer l'email avec le PDF et le lien de signature
    console.log("📧 Début de l'envoi de l'email...");
    const { sendTimesheetSignatureEmail } = await import('@/lib/signature-email');
    console.log("📨 Module email importé avec succès");
    
    const emailSent = await sendTimesheetSignatureEmail({
      userName: staffUser.name,
      userEmail: staffUser.email,
      year,
      semester,
      signatureToken,
      totalHours,
      totalCalculatedCost: Math.round(totalCalculatedCost),
      pdfBuffer: pdfArrayBuffer
    });

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
    console.error("❌ Erreur lors de la génération automatique:", error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    const errorStack = error instanceof Error ? error.stack : 'Pas de stack trace';
    
    console.error("📊 Détails de l'erreur:", {
      userId,
      year,
      semester,
      errorMessage,
      errorStack
    });
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Erreur lors de la génération automatique",
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}


