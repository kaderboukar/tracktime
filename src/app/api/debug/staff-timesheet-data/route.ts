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

    // Récupérer toutes les entrées de temps avec détails pour debug
    const allTimeEntries = await prisma.timeEntry.findMany({
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
        { user: { name: 'asc' } }
      ]
    });

    // Récupérer seulement les entrées STAFF APPROVED
    const staffApprovedEntries = await prisma.timeEntry.findMany({
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
        { user: { name: 'asc' } }
      ]
    });

    // Statistiques par statut
    const statusStats = await prisma.timeEntry.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    // Statistiques par rôle utilisateur (pour debug futur)
    // const roleStats = await prisma.timeEntry.groupBy({
    //   by: ['userId'],
    //   _count: {
    //     id: true
    //   }
    // });

    // Statistiques par année/semestre
    const periodStats = await prisma.timeEntry.groupBy({
      by: ['year', 'semester'],
      _count: {
        id: true
      },
      orderBy: [
        { year: 'desc' },
        { semester: 'asc' }
      ]
    });

    return NextResponse.json({
      success: true,
      data: {
        totalEntries: allTimeEntries.length,
        staffApprovedEntries: staffApprovedEntries.length,
        statusBreakdown: statusStats,
        periodBreakdown: periodStats,
        sampleAllEntries: allTimeEntries.slice(0, 3),
        sampleStaffApproved: staffApprovedEntries.slice(0, 3),
        availableYears: [...new Set(allTimeEntries.map(e => e.year))].sort((a, b) => b - a),
        availableSemesters: [...new Set(allTimeEntries.map(e => e.semester))].sort(),
        staffUsers: [...new Set(allTimeEntries
          .filter(e => e.user.role === 'STAFF')
          .map(e => ({ id: e.user.id, name: e.user.name, role: e.user.role }))
        )]
      }
    });

  } catch (error) {
    console.error("Erreur lors de la récupération des données de debug:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur lors de la récupération des données de debug",
        error: process.env.NODE_ENV === "development" ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}
