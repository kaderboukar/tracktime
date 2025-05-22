import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { type NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { role } = authResult;

    if (role !== 'PMSU' && role !== 'MANAGEMENT') {
      return NextResponse.json(
        { message: "Accès non autorisé. Vous devez être administrateur ou manager." },
        { status: 403 }
      );
    }

    const projectId = parseInt(params.projectId);
    if (isNaN(projectId)) {
      return NextResponse.json(
        { message: "ID projet invalide" },
        { status: 400 }
      );
    }const body = await request.json();
    const { userId, allocationPercentage } = body;

    // Vérifier que l'utilisateur existe et obtenir les assignations existantes dans une seule transaction
    const userProject = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: {
          projects: {
            select: {
              allocationPercentage: true
            }
          }
        },
      });

      if (!user) {
        throw new Error("Utilisateur non trouvé");
      }

      // Vérifier que le projet existe
      const project = await tx.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new Error("Projet non trouvé");
      }

      // Vérifier si l'assignation existe déjà
      const existingAssignment = await tx.userProject.findUnique({
        where: {
          userId_projectId: {
            userId,
            projectId,
          },
        },
      });

      if (existingAssignment) {
        throw new Error("L'assignation existe déjà");
      }

      // Calculer le total actuel des pourcentages
      const currentAssignments = await tx.userProject.findMany({
        where: { userId },
        select: { allocationPercentage: true },
      });

      const currentTotal = currentAssignments.reduce(
        (sum, p) => sum + p.allocationPercentage,
        0
      );

      // Vérifier que le nouveau total ne dépasse pas 100%
      if (currentTotal + allocationPercentage > 100) {
        throw new Error(`Le total des pourcentages (${currentTotal + allocationPercentage}%) dépasse 100%`);
      }

      // Créer l'assignation
      return await tx.userProject.create({
        data: {
          userId,
          projectId,
          allocationPercentage,
          assignedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    });

    return NextResponse.json(userProject);  } catch (error) {
    console.error("Erreur lors de la création de l'assignation:", error);
    
    if (error instanceof Error) {
      // Si c'est une erreur d'authentification
      if (error.message.includes("non authentifié") || error.message.includes("non autorisé")) {
        return NextResponse.json(
          { message: "Vous devez être connecté pour effectuer cette action" },
          { status: 401 }
        );
      }
      
      // Pour les autres erreurs connues, retourner le message d'erreur
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    }
    
    // Pour les erreurs inconnues
    return NextResponse.json(
      { message: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// Mettre à jour les autres méthodes de la même manière
export async function PATCH(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;

    const projectId = parseInt(params.projectId);
    if (isNaN(projectId)) {
      return NextResponse.json(
        { message: "ID projet invalide" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { userId, allocationPercentage } = body;

    // Vérification de l'assignation existante
    const existingAssignment = await prisma.userProject.findUnique({
      where: { 
        userId_projectId: { userId, projectId } 
      },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { message: "Assignation non trouvée" },
        { status: 404 }
      );
    }

    // Vérification du total des pourcentages
    const userProjects = await prisma.userProject.findMany({
      where: { 
        userId,
        NOT: { projectId }
      },
    });

    const totalPercentage = userProjects.reduce(
      (sum, p) => sum + p.allocationPercentage,
      0
    ) + allocationPercentage;

    if (totalPercentage > 100) {
      return NextResponse.json(
        { message: "Le total des pourcentages dépasse 100%" },
        { status: 400 }
      );
    }

    // Mise à jour de l'assignation
    const updatedAssignment = await prisma.userProject.update({
      where: { 
        userId_projectId: { userId, projectId } 
      },
      data: {
        allocationPercentage,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Assignation mise à jour",
      assignment: updatedAssignment,
    });
  } catch {
    return NextResponse.json(
      { message: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;

    const projectId = parseInt(params.projectId);
    if (isNaN(projectId)) {
      return NextResponse.json(
        { message: "ID projet invalide" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId || typeof userId !== "number") {
      return NextResponse.json(
        { message: "ID utilisateur invalide" },
        { status: 400 }
      );
    }

    try {
      const assignment = await prisma.userProject.findUnique({
        where: { userId_projectId: { userId, projectId } },
      });
      if (!assignment) {
        return NextResponse.json(
          { message: "Assignation non trouvée" },
          { status: 404 }
        );
      }

      await prisma.userProject.delete({
        where: { userId_projectId: { userId, projectId } },
      });
      return NextResponse.json({ message: "Assignation supprimée" });
    } catch (error) {
      return NextResponse.json(
        { message: "Erreur serveur", error: (error as Error).message },
        { status: 500 }
      );
    }
  } catch {
    return NextResponse.json(
      { message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
