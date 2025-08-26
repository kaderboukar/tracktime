import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const authResult = await authenticate(request);
  if (authResult instanceof NextResponse) return authResult;
  
  const userId = authResult.userId;

  try {
    // Récupérer les projets assignés à l'utilisateur
    const userProjects = await prisma.userProject.findMany({
      where: { userId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            projectNumber: true,
            staffAccess: true
          }
        }
      },
    });

    // Extraire les projets de la relation
    const assignedProjects = userProjects.map(up => up.project);

    return NextResponse.json({
      success: true,
      data: assignedProjects
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
