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

    // Récupérer les paramètres de filtrage
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const semester = searchParams.get("semester");

    // Construire la requête avec les filtres
    const where = {
      ...(year && semester ? {
        year: parseInt(year),
        semester: semester as "S1" | "S2"
      } : {})
    };

    console.log("Filtres de recherche:", where);

    const timeEntries = await prisma.timeEntry.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            indice: true,
            grade: true,
            type: true,
            proformaCosts: {
              where: {
                year: parseInt(year || new Date().getFullYear().toString())
              },
              select: {
                cost: true
              }
            }
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

    // Transformer les données pour inclure le coût proforma
    const transformedEntries = timeEntries.map(entry => ({
      ...entry,
      user: {
        ...entry.user,
        proformaCost: entry.user.proformaCosts[0]?.cost || 0
      }
    }));

    console.log("Nombre d'entrées trouvées:", transformedEntries.length);

    return NextResponse.json({
      success: true,
      data: transformedEntries,
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