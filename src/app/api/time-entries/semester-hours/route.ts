import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { role } = authResult;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const semester = searchParams.get("semester");
    const year = searchParams.get("year");

    if (!userId || !semester || !year) {
      return NextResponse.json(
        { success: false, message: "Paramètres manquants" },
        { status: 400 }
      );
    }

    // Pour les utilisateurs STAFF, ne compter que les entrées APPROVED
    // Pour ADMIN/PMSU, compter toutes les entrées
    const whereClause = (role === "ADMIN" || role === "PMSU")
      ? {
          userId: parseInt(userId),
          semester: semester as "S1" | "S2",
          year: parseInt(year)
        }
      : {
          userId: parseInt(userId),
          semester: semester as "S1" | "S2",
          year: parseInt(year),
          status: "APPROVED" as const
        };

    const existingEntries = await prisma.timeEntry.findMany({
      where: whereClause,
      select: {
        hours: true
      }
    });

    const totalHours = existingEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const remainingHours = Math.max(0, 480 - totalHours);

    return NextResponse.json({
      success: true,
      totalHours,
      remainingHours
    });

  } catch (error) {
    console.error("Erreur dans /api/time-entries/semester-hours:", error);
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