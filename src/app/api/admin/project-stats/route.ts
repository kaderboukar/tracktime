import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateHourlyCost, HOURS_PER_SEMESTER } from "@/lib/workHours";

interface ProjectStat {
  projectId: number;
  projectName: string;
  projectNumber: string;
  year: number;
  semester: string;
  totalHours: number;
  entriesCount: number;
  users: Set<string>;
  activities: Set<string>;
  userProformaCosts: Map<number, number>;
}

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

    // Récupérer d'abord la période active
    const activePeriod = await prisma.timePeriod.findFirst({
      where: { isActive: true }
    });

    // Récupérer toutes les entrées de temps APPROUVÉES avec les informations du projet
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        status: "APPROVED"
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            projectNumber: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            proformaCosts: {
              select: {
                year: true,
                cost: true
              }
            }
          }
        },
        activity: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { year: 'desc' },
        { semester: 'asc' },
        { project: { name: 'asc' } }
      ]
    });

    // Regrouper par projet, année et semestre
    const projectStats = timeEntries.reduce((acc, entry) => {
      const key = `${entry.projectId}-${entry.year}-${entry.semester}`;

      if (!acc[key]) {
        acc[key] = {
          projectId: entry.projectId,
          projectName: entry.project.name,
          projectNumber: entry.project.projectNumber,
          year: entry.year,
          semester: entry.semester,
          totalHours: 0,
          entriesCount: 0,
          users: new Set(),
          activities: new Set(),
          userProformaCosts: new Map() // Pour stocker les coûts proforma par utilisateur
        };
      }

      acc[key].totalHours += entry.hours;
      acc[key].entriesCount += 1;
      acc[key].users.add(entry.user.name);
      acc[key].activities.add(entry.activity.name);

      // Ajouter le coût proforma de l'utilisateur pour la période active (pas l'année de l'entrée)
      const targetYear = activePeriod?.year || entry.year;
      const proformaCostForYear = entry.user.proformaCosts.find(pc => pc.year === targetYear);
      if (proformaCostForYear && !acc[key].userProformaCosts.has(entry.userId)) {
        acc[key].userProformaCosts.set(entry.userId, proformaCostForYear.cost);
      }
      
      // Debug pour le premier projet
      if (entry.projectId === 1) {
        console.log(`Debug coût proforma pour projet ${entry.project.name}:`);
        console.log(`  - Année cible: ${targetYear}`);
        console.log(`  - Coûts proforma disponibles:`, entry.user.proformaCosts);
        console.log(`  - Coût trouvé:`, proformaCostForYear);
        console.log(`  - Coût final:`, proformaCostForYear?.cost || 0);
      }

      return acc;
    }, {} as Record<string, ProjectStat>);

    // Convertir en tableau et formater avec calculs de coût
    const formattedStats = Object.values(projectStats).map((stat: ProjectStat) => {
      // ✅ UTILISER LA FORMULE STANDARDISÉE
      const totalProformaCosts = Array.from(stat.userProformaCosts.values()).reduce((sum: number, cost: number) => sum + cost, 0);

      // 1. Somme des proformaCost / 2 (pour le semestre)
      const semesterCosts = totalProformaCosts / 2;

      // 2. Résultat / 480 (heures par semestre)
      const hourlyCosts = semesterCosts / HOURS_PER_SEMESTER;

      // 3. Résultat * total heures par projet
      const totalCalculatedCost = hourlyCosts * stat.totalHours;

      return {
        projectId: stat.projectId,
        projectName: stat.projectName,
        projectNumber: stat.projectNumber,
        year: stat.year,
        semester: stat.semester,
        totalHours: stat.totalHours,
        entriesCount: stat.entriesCount,
        usersCount: stat.users.size,
        activitiesCount: stat.activities.size,
        users: Array.from(stat.users),
        activities: Array.from(stat.activities),
        // ✅ CALCULS STANDARDISÉS
        totalProformaCosts: Math.round(totalProformaCosts),
        semesterCosts: Math.round(semesterCosts),
        hourlyCosts: Math.round(hourlyCosts * 100) / 100, // Arrondir à 2 décimales
        totalCalculatedCost: Math.round(totalCalculatedCost)
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedStats
    });

  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques par projet:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur lors de la récupération des statistiques par projet"
      },
      { status: 500 }
    );
  }
}
