import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
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

    // 1. Total des projets dans la base de données
    const totalProjects = await prisma.project.count();

    // 2. Utilisateurs actifs (ayant au moins une entrée de temps)
    const activeUsers = await prisma.user.count({
      where: {
        isActive: true
      }
    });

    // 3. Total des heures de toutes les entrées de temps APPROUVÉES
    const totalHoursResult = await prisma.timeEntry.aggregate({
      where: {
        status: "APPROVED"
      },
      _sum: {
        hours: true
      }
    });
    const totalHours = totalHoursResult._sum.hours || 0;

    // 4. Total des entrées de temps APPROUVÉES
    const totalEntries = await prisma.timeEntry.count({
      where: {
        status: "APPROVED"
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        totalProjects,
        activeUsers,
        totalHours,
        totalEntries
      }
    });

  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques admin:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur lors de la récupération des statistiques"
      },
      { status: 500 }
    );
  }
}
