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

export async function POST(request: NextRequest) {
  try {
    let authResult;
    const { signatureToken, signedPdfData } = await request.json();

    if (!signatureToken || !signedPdfData) {
      return NextResponse.json(
        { success: false, message: "Token de signature et PDF signé requis" },
        { status: 400 }
      );
    }

    // Essayer d'abord l'authentification JWT standard
    authResult = await authenticate(request);
    
    // Si l'authentification JWT échoue, essayer avec le token de signature
    if (authResult instanceof NextResponse) {
      // Vérifier si c'est une erreur d'authentification
      if (authResult.status === 401) {
        // Essayer l'authentification via token de signature
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

    // Vérifier que le token de signature existe et n'est pas expiré
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

    if (signedTimesheet.signatureStatus !== 'PENDING') {
      return NextResponse.json(
        { success: false, message: "Cette feuille de temps a déjà été signée" },
        { status: 400 }
      );
    }

    // Convertir le PDF signé en Buffer
    const pdfBuffer = Buffer.from(signedPdfData, 'base64');

    // Mettre à jour le statut et sauvegarder le PDF signé
    await prisma.signedTimesheet.update({
      where: { signatureToken },
      data: {
        signedPdfData: pdfBuffer,
        signatureStatus: 'SIGNED',
        signatureDate: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: "Feuille de temps signée avec succès",
      data: {
        userId: signedTimesheet.userId,
        userName: signedTimesheet.user.name,
        year: signedTimesheet.year,
        semester: signedTimesheet.semester,
        signatureDate: new Date()
      }
    });

  } catch (error) {
    console.error("Erreur lors de la signature:", error);
    return NextResponse.json(
      { success: false, message: "Erreur lors de la signature" },
      { status: 500 }
    );
  }
}

// GET pour récupérer les informations de signature
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

    return NextResponse.json({
      success: true,
      data: {
        userId: signedTimesheet.userId,
        userName: signedTimesheet.user.name,
        year: signedTimesheet.year,
        semester: signedTimesheet.semester,
        signatureStatus: signedTimesheet.signatureStatus,
        expiresAt: signedTimesheet.expiresAt
      }
    });

  } catch (error) {
    console.error("Erreur lors de la récupération des informations:", error);
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
