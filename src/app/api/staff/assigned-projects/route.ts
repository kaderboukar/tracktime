import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticate(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { userId, role } = authResult;

    // Vérifier que l'utilisateur est STAFF
    if (role !== 'STAFF') {
      return NextResponse.json(
        { success: false, message: "Accès réservé aux utilisateurs STAFF" },
        { status: 403 }
      );
    }

    // Récupérer les projets assignés à l'utilisateur STAFF
    const assignments = await prisma.userProject.findMany({
      where: {
        userId: userId
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            projectNumber: true,
          },
        },
      },
    });

    // Formater les données pour correspondre au type ProjectAssignment
    const formattedAssignments = assignments.map(assignment => ({
      projectId: assignment.projectId,
      project: assignment.project,
      assignmentType: "SECONDARY" as const,
      allocationPercentage: assignment.allocationPercentage,
      userId: assignment.userId,
    }));

    return NextResponse.json({
      success: true,
      data: formattedAssignments,
    });
  } catch (error) {
    console.error("Erreur dans /api/staff/assigned-projects:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Une erreur est survenue lors de la récupération des projets assignés",
      },
      { status: 500 }
    );
  }
}
