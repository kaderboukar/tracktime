import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Récupérer tous les utilisateurs STAFF
    const staffUsers = await prisma.user.findMany({
      where: {
        role: "STAFF"
      },
      include: {
        proformaCosts: true,
        timeEntries: {
          include: {
            project: true,
            activity: true
          }
        }
      }
    });

    // Récupérer toutes les entrées de temps APPROVED des STAFF
    const approvedStaffEntries = await prisma.timeEntry.findMany({
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
            role: true,
            proformaCosts: true
          }
        },
        project: true,
        activity: true
      }
    });

    // Statistiques générales
    const totalStaffUsers = await prisma.user.count({
      where: { role: "STAFF" }
    });

    const totalApprovedEntries = await prisma.timeEntry.count({
      where: {
        status: "APPROVED",
        user: { role: "STAFF" }
      }
    });

    const totalPendingEntries = await prisma.timeEntry.count({
      where: {
        status: "PENDING",
        user: { role: "STAFF" }
      }
    });

    return NextResponse.json({
      success: true,
      debug: {
        totalStaffUsers,
        totalApprovedEntries,
        totalPendingEntries,
        staffUsers,
        approvedStaffEntries
      }
    });

  } catch (error) {
    console.error("Erreur lors du debug des données STAFF:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur lors du debug",
        error: error instanceof Error ? error.message : "Erreur inconnue"
      },
      { status: 500 }
    );
  }
}
