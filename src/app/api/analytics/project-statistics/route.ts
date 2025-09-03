import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "@/lib/auth";
import { calculateProjectTotalCost, calculateEntryCost } from "@/lib/workHours";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const authResult = await authenticate(request);
  if (authResult instanceof NextResponse) return authResult;
  
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');
  const semester = searchParams.get('semester');

  try {
    // Récupérer tous les projets avec leurs entrées de temps
    const projectsWithTimeEntries = await prisma.project.findMany({
      include: {
        timeEntries: {
          where: {
            ...(year && semester ? {
              year: parseInt(year),
              semester: semester as "S1" | "S2"
            } : {}),
            status: "APPROVED" // Seulement les entrées approuvées
          },
          include: {
            user: {
              include: {
                proformaCosts: {
                  where: {
                    year: year ? parseInt(year) : new Date().getFullYear()
                  }
                }
              }
            }
          }
        }
      }
    });

    // Calculer les statistiques pour chaque projet
    const projectStatistics = projectsWithTimeEntries.map(project => {
      const totalHours = project.timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
      
      // ✅ UTILISER LA FORMULE STANDARDISÉE
      const totalAmount = calculateProjectTotalCost(project.timeEntries);
      
      // Statistiques par utilisateur
      const userStats = new Map();

      project.timeEntries.forEach(entry => {
        const user = entry.user;
        const proformaCost = user.proformaCosts[0];
        
        if (proformaCost) {
          // ✅ UTILISER LA FORMULE STANDARDISÉE
          const entryAmount = calculateEntryCost(entry.hours, proformaCost.cost);
          
          // Statistiques par utilisateur
          if (!userStats.has(user.id)) {
            userStats.set(user.id, {
              userId: user.id,
              userName: user.name,
              userEmail: user.email,
              totalHours: 0,
              totalAmount: 0
            });
          }
          
          const userStat = userStats.get(user.id);
          userStat.totalHours += entry.hours;
          userStat.totalAmount += entryAmount;
        }
      });

      return {
        projectId: project.id,
        projectName: project.name,
        projectNumber: project.projectNumber,
        projectType: project.projectType,
        totalHours,
        totalAmount: Math.round(totalAmount * 100) / 100, // Arrondir à 2 décimales
        userCount: userStats.size,
        userStats: Array.from(userStats.values()),
        timeEntryCount: project.timeEntries.length
      };
    });

    // Trier par montant décroissant
    projectStatistics.sort((a, b) => b.totalAmount - a.totalAmount);

    // Calculer le montant total récupéré
    const totalRecoveredAmount = projectStatistics.reduce((sum, project) => sum + project.totalAmount, 0);

    return NextResponse.json({
      success: true,
      data: {
        projects: projectStatistics,
        totalRecoveredAmount: Math.round(totalRecoveredAmount * 100) / 100,
        summary: {
          totalProjects: projectStatistics.length,
          totalHours: projectStatistics.reduce((sum, project) => sum + project.totalHours, 0),
          totalUsers: new Set(projectStatistics.flatMap(p => p.userStats.map(u => u.userId))).size
        }
      }
    });

  } catch (error) {
    console.error("Erreur lors du calcul des statistiques par projet:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Erreur lors du calcul des statistiques",
        data: null
      },
      { status: 500 }
    );
  }
}
