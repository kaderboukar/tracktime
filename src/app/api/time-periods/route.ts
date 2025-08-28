import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { z } from "zod";
import { Semester } from "@prisma/client";

// Schéma de validation pour la création/modification d'une période
const timePeriodSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  semester: z.enum(["S1", "S2"]).transform((val): Semester => val as Semester),
  isActive: z.boolean().optional()
});

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly');

    if (activeOnly === 'true') {
      // Récupérer seulement la période active
      const activePeriod = await prisma.timePeriod.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });

      if (!activePeriod) {
        return NextResponse.json({
          success: false,
          message: "Aucune période active trouvée",
          data: null
        });
      }

      return NextResponse.json({
        success: true,
        data: activePeriod
      });
    } else {
      // Récupérer toutes les périodes
      const allPeriods = await prisma.timePeriod.findMany({
        orderBy: [
          { year: 'desc' },
          { semester: 'desc' }
        ]
      });

      return NextResponse.json({
        success: true,
        data: allPeriods
      });
    }

  } catch (error) {
    console.error("Erreur dans /api/time-periods GET:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur",
        error: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { role } = authResult;

    // Vérifier que l'utilisateur est ADMIN ou PMSU
    if (role !== "ADMIN" && role !== "PMSU") {
      return NextResponse.json(
        { success: false, message: "Accès non autorisé. Seuls les administrateurs peuvent créer des périodes." },
        { status: 403 }
      );
    }

    const data = await request.json();
    
    // Valider les données
    const validatedData = timePeriodSchema.parse(data);

    // Vérifier si une période avec la même année/semestre existe déjà
    const existingPeriod = await prisma.timePeriod.findFirst({
      where: {
        year: validatedData.year,
        semester: validatedData.semester
      }
    });

    if (existingPeriod) {
      return NextResponse.json(
        { success: false, message: "Une période pour cette année et semestre existe déjà" },
        { status: 400 }
      );
    }

    // Si la nouvelle période doit être active, désactiver toutes les autres
    if (validatedData.isActive) {
      await prisma.timePeriod.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });
    }

    // Créer la nouvelle période
    const newPeriod = await prisma.timePeriod.create({
      data: {
        year: validatedData.year,
        semester: validatedData.semester,
        isActive: validatedData.isActive || false
      }
    });

    return NextResponse.json({
      success: true,
      data: newPeriod,
      message: "Période créée avec succès"
    });

  } catch (error) {
    console.error("Erreur dans /api/time-periods POST:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Données invalides", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur",
        error: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { role } = authResult;

    // Vérifier que l'utilisateur est ADMIN ou PMSU
    if (role !== "ADMIN" && role !== "PMSU") {
      return NextResponse.json(
        { success: false, message: "Accès non autorisé. Seuls les administrateurs peuvent modifier des périodes." },
        { status: 403 }
      );
    }

    const data = await request.json();
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID de la période manquant" },
        { status: 400 }
      );
    }

    // Valider les données
    const validatedData = timePeriodSchema.partial().parse(updateData);

    // Vérifier si la période existe
    const existingPeriod = await prisma.timePeriod.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingPeriod) {
      return NextResponse.json(
        { success: false, message: "Période non trouvée" },
        { status: 404 }
      );
    }

    // Si la période doit être activée, désactiver toutes les autres
    if (validatedData.isActive) {
      await prisma.timePeriod.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });
    }

    // Mettre à jour la période
    const updatedPeriod = await prisma.timePeriod.update({
      where: { id: parseInt(id) },
      data: validatedData
    });

    return NextResponse.json({
      success: true,
      data: updatedPeriod,
      message: "Période mise à jour avec succès"
    });

  } catch (error) {
    console.error("Erreur dans /api/time-periods PUT:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Données invalides", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur",
        error: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}
