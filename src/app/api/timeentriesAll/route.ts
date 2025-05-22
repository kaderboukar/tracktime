import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request);

    // Si authResult est une instance de NextResponse, cela signifie qu'il y a une erreur d'authentification
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { userId, role } = authResult;

    // Vérification supplémentaire pour s'assurer que seuls les administrateurs peuvent voir toutes les entrées
    if (role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Accès non autorisé. Seuls les administrateurs peuvent voir toutes les entrées de temps.",
        },
        { status: 403 }
      );
    }

    const timeEntries = await prisma.timeEntry.findMany({
      include: {
        user: {
          select: {
            name: true,
            indice: true,
            grade: true,
            proformaCost: true,
            type: true,
          },
        },
        project: {
          select: {
            name: true,
            projectNumber: true,
            staffAccess: true,
            projectType: true,
          },
        },
        activity: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: timeEntries,
    });
  } catch (error) {
    console.error("Erreur dans /api/timeentriesAll:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      },
      { status: 500 }
    );
  }
}