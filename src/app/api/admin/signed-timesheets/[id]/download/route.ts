import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const authResult = await authenticate(req);
    if (authResult instanceof NextResponse) return authResult;

    const { role } = authResult;

    // Vérifier que l'utilisateur est ADMIN ou PMSU
    if (role !== "ADMIN" && role !== "PMSU") {
      return NextResponse.json(
        { success: false, message: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const timesheetId = parseInt(resolvedParams.id);

    if (isNaN(timesheetId)) {
      return NextResponse.json(
        { success: false, message: "ID de feuille de temps invalide" },
        { status: 400 }
      );
    }

    // Récupérer la feuille de temps signée
    const signedTimesheet = await prisma.signedTimesheet.findUnique({
      where: { id: timesheetId },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    });

    if (!signedTimesheet) {
      return NextResponse.json(
        { success: false, message: "Feuille de temps non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que le PDF signé existe
    if (!signedTimesheet.signedPdfData) {
      return NextResponse.json(
        { success: false, message: "PDF signé non disponible" },
        { status: 404 }
      );
    }

    // Créer le nom du fichier
    const fileName = `feuille_temps_signee_${signedTimesheet.user.name}_${signedTimesheet.year}_${signedTimesheet.semester}.pdf`;

    // Retourner le PDF signé
    return new NextResponse(signedTimesheet.signedPdfData, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': signedTimesheet.signedPdfData.length.toString()
      }
    });

  } catch (error) {
    console.error("Erreur lors du téléchargement du PDF signé:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur lors du téléchargement du PDF signé"
      },
      { status: 500 }
    );
  }
}
