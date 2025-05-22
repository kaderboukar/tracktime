import { NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";
import { getToken } from "@/lib/auth";
import { MAX_HOURS_PER_SEMESTER } from "@/lib/constants";

export async function GET(request: Request) {
  try {
    const token = await getToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const semester = url.searchParams.get("semester");
    const year = url.searchParams.get("year");

    if (!userId || !semester || !year) {
      return NextResponse.json(
        { success: false, message: "Paramètres manquants" },
        { status: 400 }
      );
    }

    // Calculer le total des heures pour l'utilisateur dans le semestre spécifié
    const totalHours = await prisma.timeEntry.aggregate({
      where: {
        userId: parseInt(userId),
        semester: semester as "S1" | "S2",
        year: parseInt(year),
      },
      _sum: {
        hours: true,
      },
    });

    const usedHours = totalHours._sum.hours || 0;
    const remainingHours = Math.max(0, MAX_HOURS_PER_SEMESTER - usedHours);

    return NextResponse.json({
      success: true,
      remainingHours,
      totalHours: usedHours,
    });
  } catch (error) {
    console.error("Erreur lors du calcul des heures restantes:", error);
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
