import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateHourlyCost, HOURS_PER_SEMESTER } from "@/lib/workHours";

interface ProjectDetail {
  projectName: string;
  projectNumber: string;
  hours: number;
  entries: number;
}

interface TimesheetStat {
  userId: number;
  userName: string;
  userEmail: string;
  userGrade: string;
  userType: string;
  userProformaCost: number;
  year: number;
  semester: string;
  totalHours: number;
  entriesCount: number;
  projects: Set<string>;
  activities: Set<string>;
  projectDetails: Map<string, ProjectDetail>;
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

    // Récupérer toutes les entrées de temps APPROUVÉES avec les informations de l'utilisateur
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        status: "APPROVED"
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            grade: true,
            type: true,
            proformaCosts: true
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
            name: true
          }
        }
      },
      orderBy: [
        { year: 'desc' },
        { semester: 'asc' },
        { user: { name: 'asc' } }
      ]
    });

    // Regrouper par utilisateur, année et semestre
    const timesheetStats = timeEntries.reduce((acc, entry) => {
      const key = `${entry.userId}-${entry.year}-${entry.semester}`;

      if (!acc[key]) {
        // Récupérer le coût proforma pour l'année de l'entrée
        const proformaCostForYear = entry.user.proformaCosts.find(pc => pc.year === entry.year);
        const userProformaCost = proformaCostForYear ? proformaCostForYear.cost : 0;

        acc[key] = {
          userId: entry.userId,
          userName: entry.user.name,
          userEmail: entry.user.email,
          userGrade: entry.user.grade,
          userType: entry.user.type,
          userProformaCost: userProformaCost,
          year: entry.year,
          semester: entry.semester,
          totalHours: 0,
          entriesCount: 0,
          projects: new Set(),
          activities: new Set(),
          projectDetails: new Map()
        };
      }

      acc[key].totalHours += entry.hours;
      acc[key].entriesCount += 1;
      acc[key].projects.add(entry.project.name);
      acc[key].activities.add(entry.activity.name);

      // Détails par projet
      const projectKey = entry.project.name;
      if (!acc[key].projectDetails.has(projectKey)) {
        acc[key].projectDetails.set(projectKey, {
          projectName: entry.project.name,
          projectNumber: entry.project.projectNumber,
          hours: 0,
          entries: 0
        });
      }
      const projectDetail = acc[key].projectDetails.get(projectKey);
      if (projectDetail) {
        projectDetail.hours += entry.hours;
        projectDetail.entries += 1;
      }

      return acc;
    }, {} as Record<string, TimesheetStat>);

    // Convertir en tableau et formater avec calculs de coût
    const formattedTimesheet = Object.values(timesheetStats).map((stat: TimesheetStat) => {
      // ✅ UTILISER LA FORMULE STANDARDISÉE
      const semesterCost = stat.userProformaCost / 2; // Coût par semestre
      const hourlyCost = semesterCost / HOURS_PER_SEMESTER; // Coût horaire (480 heures par semestre)
      const totalCost = hourlyCost * stat.totalHours;

      return {
        userId: stat.userId,
        userName: stat.userName,
        userEmail: stat.userEmail,
        userGrade: stat.userGrade,
        userType: stat.userType,
        userProformaCost: stat.userProformaCost,
        year: stat.year,
        semester: stat.semester,
        totalHours: stat.totalHours,
        totalCost: Math.round(totalCost),
        entriesCount: stat.entriesCount,
        projectsCount: stat.projects.size,
        activitiesCount: stat.activities.size,
        projects: Array.from(stat.projects),
        activities: Array.from(stat.activities),
        projectDetails: Object.fromEntries(stat.projectDetails)
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedTimesheet
    });

  } catch (error) {
    console.error("Erreur lors de la récupération de la feuille de temps:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur lors de la récupération de la feuille de temps"
      },
      { status: 500 }
    );
  }
}
