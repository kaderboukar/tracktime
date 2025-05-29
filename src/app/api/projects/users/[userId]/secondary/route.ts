import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const authResult = await authenticate(request);
  if (authResult instanceof NextResponse) return authResult;
  
  const userId = authResult.userId;

  try {
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


    const assignedProjectIds = user?.projects.map(p => p.projectId) || [];

    // Requête modifiée avec plus de flexibilité
    const availableProjects = await prisma.project.findMany({
      where: {
        OR: [
          { staffAccess: user?.type },
          { staffAccess: 'ALL' }  // Correction de la casse 'ALL' -> 'All'
        ],
        NOT: {
          id: {
            in: assignedProjectIds
          }
        }
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
