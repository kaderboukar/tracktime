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

interface StaffTimesheetStat {
  userId: number;
  userName: string;
  userEmail: string;
  userGrade: string;
  userType: string;
  userRole: string;
  userProformaCost: number;
  year: number;
  semester: string;
  totalHours: number;
  entriesCount: number;
  projects: Set<string>;
  activities: Set<string>;
  projectDetails: Map<string, ProjectDetail>;
}

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

    // Récupérer les paramètres de filtrage
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const semester = searchParams.get("semester");

    // Récupérer d'abord la période active
    const activePeriod = await prisma.timePeriod.findFirst({
      where: { isActive: true }
    });

    // Construire la clause where avec filtres optionnels
    const whereClause: {
      status: "APPROVED";
      user: { role: "STAFF" };
      year?: number;
      semester?: "S1" | "S2";
    } = {
      status: "APPROVED",
      user: {
        role: "STAFF"
      }
    };

    // Si aucun filtre n'est spécifié, utiliser la période active
    if (!year || !semester) {
      if (activePeriod) {
        whereClause.year = activePeriod.year;
        whereClause.semester = activePeriod.semester;
        console.log(`  - Utilisation de la période active:`, { year: activePeriod.year, semester: activePeriod.semester });
      }
    } else {
      // Sinon, utiliser les filtres fournis
      whereClause.year = parseInt(year);
      whereClause.semester = semester as "S1" | "S2";
      console.log(`  - Utilisation des filtres fournis:`, { year, semester });
    }

    // Récupérer toutes les entrées de temps APPROUVÉES des utilisateurs STAFF uniquement
    const timeEntries = await prisma.timeEntry.findMany({
      where: whereClause,
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

    // Récupérer aussi toutes les périodes disponibles pour l'interface
    const availablePeriods = await prisma.timePeriod.findMany({
      orderBy: [
        { year: 'desc' },
        { semester: 'desc' }
      ]
    });

    // Si des filtres de période sont fournis, vérifier que la période existe
    if (year && semester) {
      const periodExists = availablePeriods.some(
        period => period.year === parseInt(year) && period.semester === semester
      );
      
      if (!periodExists) {
        return NextResponse.json({
          success: false,
          message: `La période ${semester} ${year} n'existe pas dans le système`,
          data: [],
          availablePeriods: availablePeriods
        });
      }
    }

    // Regrouper par utilisateur STAFF, année et semestre
    const staffTimesheetStats = timeEntries.reduce((acc, entry) => {
      const key = `${entry.userId}-${entry.year}-${entry.semester}`;

      if (!acc[key]) {
        // Récupérer le coût proforma pour la période active (pas l'année de l'entrée)
        const targetYear = activePeriod?.year || entry.year;
        const proformaCostForYear = entry.user.proformaCosts.find(pc => pc.year === targetYear);
        const userProformaCost = proformaCostForYear ? proformaCostForYear.cost : 0;
        
        console.log(`Debug coût proforma pour ${entry.user.name}:`);
        console.log(`  - Année cible: ${targetYear}`);
        console.log(`  - Coûts proforma disponibles:`, entry.user.proformaCosts);
        console.log(`  - Coût trouvé:`, proformaCostForYear);
        console.log(`  - Coût final:`, userProformaCost);

        acc[key] = {
          userId: entry.userId,
          userName: entry.user.name,
          userEmail: entry.user.email,
          userGrade: entry.user.grade,
          userType: entry.user.type,
          userRole: entry.user.role,
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
    }, {} as Record<string, StaffTimesheetStat>);

    // Convertir en tableau et formater avec calculs de coût
    const formattedStaffTimesheet = Object.values(staffTimesheetStats).map((stat: StaffTimesheetStat) => {
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
        userRole: stat.userRole,
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
      data: formattedStaffTimesheet,
      availablePeriods: availablePeriods
    });

  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques STAFF:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur lors de la récupération des statistiques STAFF"
      },
      { status: 500 }
    );
  }
}
