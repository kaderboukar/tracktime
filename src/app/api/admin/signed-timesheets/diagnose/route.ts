import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticate(req);
    if (authResult instanceof NextResponse) return authResult;

    const { role } = authResult;

    if (role !== "ADMIN" && role !== "PMSU") {
      return NextResponse.json(
        { success: false, message: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Récupérer toutes les feuilles de temps signées
    const signedTimesheets = await prisma.signedTimesheet.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { year: 'desc' },
        { semester: 'asc' },
        { user: { name: 'asc' } }
      ]
    });

    const diagnostics = signedTimesheets.map(timesheet => {
      const diagnostic: {
        id: number;
        userId: number;
        userName: string;
        userEmail: string;
        year: number;
        semester: string;
        signatureStatus: string;
        hasSignedPdf: boolean;
        issues: string[];
        dataType?: string;
        dataSize?: number;
        pdfSignature?: string;
        pdfEnd?: string;
        isValid?: boolean;
      } = {
        id: timesheet.id,
        userId: timesheet.userId,
        userName: timesheet.user.name,
        userEmail: timesheet.user.email,
        year: timesheet.year,
        semester: timesheet.semester,
        signatureStatus: timesheet.signatureStatus,
        hasSignedPdf: !!timesheet.signedPdfData,
        issues: []
      };

      // Diagnostic des données PDF
      if (!timesheet.signedPdfData) {
        diagnostic.issues.push("signedPdfData est NULL ou undefined");
        diagnostic.dataType = "NULL";
        diagnostic.dataSize = 0;
        diagnostic.pdfSignature = "N/A";
        diagnostic.isValid = false;
      } else {
        // Vérifier le type de données
        diagnostic.dataType = typeof timesheet.signedPdfData;
        
        if (Buffer.isBuffer(timesheet.signedPdfData)) {
          diagnostic.dataType = "Buffer";
        } else if (timesheet.signedPdfData instanceof Uint8Array) {
          diagnostic.dataType = "Uint8Array";
        }

        // Vérifier la taille
        diagnostic.dataSize = timesheet.signedPdfData.length;
        
        if (diagnostic.dataSize === 0) {
          diagnostic.issues.push("Données vides (0 bytes)");
          diagnostic.isValid = false;
        } else if (diagnostic.dataSize < 100) {
          diagnostic.issues.push(`PDF très petit (${diagnostic.dataSize} bytes) - possiblement corrompu`);
        }

        // Vérifier la signature PDF
        if (diagnostic.dataSize >= 4) {
          diagnostic.pdfSignature = timesheet.signedPdfData.slice(0, 4).toString();
          
          if (diagnostic.pdfSignature !== '%PDF') {
            diagnostic.issues.push(`Signature PDF invalide: "${diagnostic.pdfSignature}" (attendu "%PDF")`);
            diagnostic.isValid = false;
          }
        } else {
          diagnostic.issues.push("Données trop courtes pour vérifier la signature");
          diagnostic.isValid = false;
        }

        // Vérifier la fin du PDF
        if (diagnostic.dataSize >= 6) {
          const end = timesheet.signedPdfData.slice(-6).toString();
          diagnostic.pdfEnd = end;
          
          if (!end.includes('%%EOF')) {
            diagnostic.issues.push("Fin de PDF suspecte");
          }
        }

        // Déterminer si le PDF est valide
        diagnostic.isValid = diagnostic.issues.length === 0;
      }

      return diagnostic;
    });

    // Statistiques globales
    const stats = {
      total: diagnostics.length,
      valid: diagnostics.filter(d => d.isValid).length,
      problematic: diagnostics.filter(d => !d.isValid).length,
      withData: diagnostics.filter(d => d.hasSignedPdf).length,
      withoutData: diagnostics.filter(d => !d.hasSignedPdf).length
    };

    // Log pour le débogage
    console.log(`Diagnostic des PDFs signés:`, {
      total: stats.total,
      valid: stats.valid,
      problematic: stats.problematic,
      issues: diagnostics.filter(d => !d.isValid).map(d => ({
        id: d.id,
        userName: d.userName,
        issues: d.issues
      }))
    });

    return NextResponse.json({
      success: true,
      data: {
        diagnostics,
        stats,
        summary: {
          message: stats.problematic > 0 
            ? `${stats.problematic} PDF(s) problématique(s) détecté(s)`
            : "Tous les PDFs semblent valides",
          recommendations: stats.problematic > 0 ? [
            "Vérifier le processus de stockage des signatures",
            "S'assurer que les PDFs sont correctement encodés",
            "Vérifier l'intégrité des données avant stockage",
            "Ajouter des validations lors du stockage"
          ] : []
        }
      }
    });

  } catch (error) {
    console.error("Erreur lors du diagnostic des PDFs signés:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur lors du diagnostic",
        error: process.env.NODE_ENV === "development" ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}
