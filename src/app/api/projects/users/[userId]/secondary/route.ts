import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const authResult = await authenticate(request);
  if (authResult instanceof NextResponse) return authResult;
  
  const userId = authResult.userId;

  try {
    // Récupérer TOUS les projets
    const allProjects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        projectNumber: true,
        staffAccess: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Récupérer les projets assignés à l'utilisateur
    const userProjects = await prisma.userProject.findMany({
      where: { userId },
      select: {
        projectId: true
      }
    });

    // Extraire les IDs des projets assignés
    const assignedProjectIds = userProjects.map(up => up.projectId);

    // Filtrer pour garder seulement les projets NON assignés
    const availableProjects = allProjects.filter(project => 
      !assignedProjectIds.includes(project.id)
    );

    return NextResponse.json({
      success: true,
      data: availableProjects
    });

  } catch (error) {
    console.error("Erreur dans /api/projects/users/[userId]/secondary:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Erreur serveur",
        data: [] // Ajouter un tableau vide par défaut
      },
      { status: 500 }
    );
  }
}
