import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
