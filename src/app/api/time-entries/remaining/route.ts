import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { MAX_HOURS_PER_SEMESTER } from "@/lib/constants";

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { userId } = authResult;

    // Récupérer le semestre et l'année actuels ou depuis les paramètres de requête
    const searchParams = new URL(request.url).searchParams;
    const semester = searchParams.get('semester');
    const year = searchParams.get('year');

    if (!semester || !year) {
      return NextResponse.json(
        { success: false, message: "Semestre et année requis" },
        { status: 400 }
      );
    }

    // Calculer les heures déjà saisies pour ce semestre
    const totalHours = await prisma.timeEntry.aggregate({
      where: {
        userId,
        semester: parseInt(semester),
        year: parseInt(year),
      },
      _sum: {
        hours: true,
      },
    });

    const usedHours = totalHours._sum.hours || 0;
    const remainingHours = MAX_HOURS_PER_SEMESTER - usedHours;

    return NextResponse.json({
      success: true,
      data: {
        maxHours: MAX_HOURS_PER_SEMESTER,
        usedHours,
        remainingHours,
      },
    });
  } catch (error) {
    console.error("Erreur dans /api/time-entries/remaining:", error);
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
