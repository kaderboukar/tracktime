import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticate, getUserIdFromToken } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const authResult = await authenticate(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Token manquant" },
        { status: 401 }
      );
    }

    const userId = await getUserIdFromToken(token);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Token invalide" },
        { status: 401 }
      );
    }

    // Récupérer l'utilisateur avec son type
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        type: true,
        projects: {
          select: {
            projectId: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer les IDs des projets déjà assignés à l'utilisateur
    const assignedProjectIds = user.projects.map(p => p.projectId);

    // Récupérer tous les projets disponibles pour le type d'utilisateur
    const availableProjects = await prisma.project.findMany({
      where: {
        AND: [
          { staffAccess: user.type },
          {
            id: {
              notIn: assignedProjectIds
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        projectNumber: true,
        staffAccess: true
      },
    });

    return NextResponse.json({
      success: true,
      data: availableProjects
    });

  } catch (error) {
    console.error("Erreur dans /api/projects/available:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur",
        error: process.env.NODE_ENV === "development" ? error : undefined
      },
      { status: 500 }
    );
  }
}
