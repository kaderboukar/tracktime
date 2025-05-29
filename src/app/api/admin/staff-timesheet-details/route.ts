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

    // Vérifier que l'utilisateur est ADMIN ou PMSU
    if (role !== "ADMIN" && role !== "PMSU") {
      return NextResponse.json(
        { success: false, message: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Récupérer toutes les entrées de temps APPROUVÉES des utilisateurs STAFF avec détails
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        status: "APPROVED",
        user: {
          role: "STAFF"
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            grade: true,
            type: true,
            role: true,
            proformaCosts: {
              select: {
                year: true,
                cost: true
              }
            }
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            projectNumber: true
          }
        },
        activity: {
          select: {
            id: true,
            name: true,
            parent: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { year: 'desc' },
        { semester: 'asc' },
        { user: { name: 'asc' } },
        { project: { name: 'asc' } }
      ]
    });

    // Formater les données avec calculs de coût pour chaque entrée
    const formattedEntries = timeEntries.map((entry) => {
      // Récupérer le coût proforma pour l'année de l'entrée
      const proformaCostForYear = entry.user.proformaCosts.find(pc => pc.year === entry.year);
      const userProformaCost = proformaCostForYear ? proformaCostForYear.cost : 0;

      // Appliquer le calcul spécifié:
      // 1. proformaCost / 2
      const semesterCost = userProformaCost / 2;

      // 2. résultat / 480
      const hourlyCost = semesterCost / 480;

      // 3. résultat * heures de cette entrée
      const entryCalculatedCost = hourlyCost * entry.hours;

      // Construire le nom de l'activité avec parent si applicable
      let activityName = entry.activity.name;
      if (entry.activity.parent) {
        activityName = `${entry.activity.parent.name} > ${entry.activity.name}`;
      }

      return {
        id: entry.id,
        staff: entry.user.name,
        staffGrade: entry.user.grade,
        staffType: entry.user.type,
        project: entry.project.name,
        projectNumber: entry.project.projectNumber,
        activity: activityName,
        year: entry.year,
        semester: entry.semester,
        hours: entry.hours,
        userProformaCost: userProformaCost,
        semesterCost: Math.round(semesterCost),
        hourlyCost: Math.round(hourlyCost * 100) / 100, // Arrondir à 2 décimales
        entryCalculatedCost: Math.round(entryCalculatedCost),
        comment: entry.comment || '',
        createdAt: entry.createdAt
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedEntries
    });

  } catch (error) {
    console.error("Erreur lors de la récupération des détails STAFF:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur lors de la récupération des détails STAFF"
      },
      { status: 500 }
    );
  }
}
