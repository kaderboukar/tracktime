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

    // Vérifier que les données ne sont pas vides
    if (signedTimesheet.signedPdfData.length === 0) {
      return NextResponse.json(
        { success: false, message: "PDF signé vide ou corrompu" },
        { status: 404 }
      );
    }

    // Créer le nom du fichier
    const fileName = `feuille_temps_signee_${signedTimesheet.user.name}_${signedTimesheet.year}_${signedTimesheet.semester}.pdf`;

    // S'assurer que les données sont bien un Buffer
    let pdfBuffer: Buffer;
    if (Buffer.isBuffer(signedTimesheet.signedPdfData)) {
      pdfBuffer = signedTimesheet.signedPdfData;
    } else if (signedTimesheet.signedPdfData instanceof Uint8Array) {
      pdfBuffer = Buffer.from(signedTimesheet.signedPdfData);
    } else {
      // Si c'est un autre type, essayer de le convertir
      pdfBuffer = Buffer.from(signedTimesheet.signedPdfData as Buffer | Uint8Array);
    }

    // Vérifier que le buffer est valide
    if (!pdfBuffer || pdfBuffer.length === 0) {
      return NextResponse.json(
        { success: false, message: "Erreur lors de la conversion des données PDF" },
        { status: 500 }
      );
    }

    // Vérifier que c'est bien un PDF (signature %PDF)
    const pdfSignature = pdfBuffer.slice(0, 4).toString();
    if (pdfSignature !== '%PDF') {
      console.warn(`Signature PDF invalide: ${pdfSignature} pour l'ID ${timesheetId}`);
      // Continuer quand même, peut-être que c'est un PDF valide avec une signature différente
    }

    // Créer la réponse avec tous les headers nécessaires
    const response = new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Accept-Ranges': 'bytes',
        'Content-Transfer-Encoding': 'binary'
      }
    });

    // Log pour le débogage
    console.log(`PDF téléchargé avec succès:`, {
      timesheetId,
      fileName,
      fileSize: pdfBuffer.length,
      pdfSignature,
      user: signedTimesheet.user.name
    });

    return response;

  } catch (error) {
    console.error("Erreur lors du téléchargement du PDF signé:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur lors du téléchargement du PDF signé",
        error: process.env.NODE_ENV === "development" ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}
