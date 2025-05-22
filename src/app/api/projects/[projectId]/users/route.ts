import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

interface AssignmentValidationResult {
  isValid: boolean;
  message?: string;
  currentTotal: number;
  existingAssignment?: {
    userId: number;
    projectId: number;
    allocationPercentage: number;
  };
}

async function validateAssignment(
  tx: Prisma.TransactionClient,
  userId: number,
  projectId: string | number,
  allocationPercentage: number
): Promise<AssignmentValidationResult> {
  const projectIdNumber = typeof projectId === "string" ? parseInt(projectId, 10) : projectId;

  if (allocationPercentage <= 0 || allocationPercentage > 100) {
    return {
      isValid: false,
      message: "Le pourcentage d'allocation doit être entre 1 et 100",
      currentTotal: 0
    };
  }

  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });

  if (!user) {
    return {
      isValid: false,
      message: "Utilisateur non trouvé",
      currentTotal: 0
    };
  }

  const project = await tx.project.findUnique({
    where: { id: projectIdNumber },
    select: { id: true }
  });

  if (!project) {
    return {
      isValid: false,
      message: "Projet non trouvé",
      currentTotal: 0
    };
  }

  const existingAssignment = await tx.userProject.findUnique({
    where: {
      userId_projectId: { userId, projectId: projectIdNumber }
    }
  });

  if (existingAssignment) {
    return {
      isValid: false,
      message: "L'utilisateur a déjà une assignation pour ce projet",
      currentTotal: 0,
      existingAssignment
    };
  }

  const currentAssignments = await tx.userProject.findMany({
    where: { userId },
    select: { allocationPercentage: true }
  });

  const currentTotal = currentAssignments.reduce(
    (sum, p) => sum + p.allocationPercentage,
    0
  );

  const newTotal = currentTotal + allocationPercentage;
  if (newTotal > 100) {
    const availablePercentage = 100 - currentTotal;
    return {
      isValid: false,
      message: `Le total des assignations (${newTotal}%) dépasserait 100%. Pourcentage disponible: ${availablePercentage}%`,
      currentTotal
    };
  }

  return {
    isValid: true,
    currentTotal: newTotal
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { projectId } = params;
    const projectIdNumber = parseInt(projectId, 10);

    if (isNaN(projectIdNumber)) {
      return NextResponse.json(
        { success: false, message: "ID de projet invalide" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { userId, allocationPercentage } = body;

    if (!userId || typeof allocationPercentage !== "number") {
      return NextResponse.json(
        { success: false, message: "Données d'assignation invalides" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const validationResult = await validateAssignment(
        tx,
        userId,
        projectIdNumber,
        allocationPercentage
      );

      if (!validationResult.isValid) {
        throw new Error(validationResult.message || "Validation de l'assignation échouée");
      }

      const assignment = await tx.userProject.create({
        data: {
          userId,
          projectId: projectIdNumber,
          allocationPercentage
        },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          },
          project: {
            select: {
              name: true,
              projectNumber: true
            }
          }
        }
      });

      const allUserAssignments = await tx.userProject.findMany({
        where: { userId },
        include: {
          project: {
            select: {
              name: true
            }
          }
        }
      });

      return {
        assignment,
        validationResult,
        allUserAssignments
      };
    });

    return NextResponse.json({
      success: true,
      message: "Assignation créée avec succès",
      data: {
        assignment: result.assignment,
        totalAllocation: result.validationResult.currentTotal,
        remainingAllocation: 100 - result.validationResult.currentTotal,
        allAssignments: result.allUserAssignments
      }
    });
  } catch (error) {
    console.error("Erreur lors de la création de l'assignation:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Une erreur est survenue lors de la création de l'assignation"
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) return authResult;

    const { role } = authResult;
    if (role !== "PMSU" && role !== "MANAGEMENT") {
      return NextResponse.json(
        {
          success: false,
          message: "Accès non autorisé. Vous devez être administrateur ou manager."
        },
        { status: 403 }
      );
    }

    const projectId = parseInt(params.projectId, 10);
    if (isNaN(projectId)) {
      return NextResponse.json(
        { success: false, message: "ID projet invalide" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { userId, allocationPercentage } = body;

    const result = await prisma.$transaction(async (tx) => {
      const existingAssignment = await tx.userProject.findUnique({
        where: {
          userId_projectId: { userId, projectId }
        },
        include: {
          user: {
            select: {
              name: true
            }
          },
          project: {
            select: {
              name: true
            }
          }
        }
      });

      if (!existingAssignment) {
        throw new Error("Assignation non trouvée");
      }

      const validationResult = await validateAssignment(
        tx,
        userId,
        projectId,
        allocationPercentage
      );

      if (!validationResult.isValid) {
        throw new Error(validationResult.message);
      }

      return await tx.userProject.update({
        where: {
          userId_projectId: { userId, projectId }
        },
        data: {
          allocationPercentage,
          updatedAt: new Date()
        },
        include: {
          user: {
            select: {
              name: true
            }
          },
          project: {
            select: {
              name: true
            }
          }
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: "Assignation mise à jour avec succès",
      data: { assignment: result }
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'assignation:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Une erreur est survenue lors de la mise à jour de l'assignation"
      },
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

    const { role } = authResult;
    if (role !== "PMSU" && role !== "MANAGEMENT") {
      return NextResponse.json(
        {
          success: false,
          message: "Accès non autorisé. Vous devez être administrateur ou manager."
        },
        { status: 403 }
      );
    }

    const projectId = parseInt(params.projectId, 10);
    if (isNaN(projectId)) {
      return NextResponse.json(
        { success: false, message: "ID projet invalide" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId || typeof userId !== "number") {
      return NextResponse.json(
        { success: false, message: "ID utilisateur invalide" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const assignment = await tx.userProject.findUnique({
        where: {
          userId_projectId: { userId, projectId }
        },
        include: {
          user: {
            select: {
              name: true
            }
          },
          project: {
            select: {
              name: true
            }
          }
        }
      });

      if (!assignment) {
        throw new Error("Assignation non trouvée");
      }

      await tx.userProject.delete({
        where: {
          userId_projectId: { userId, projectId }
        }
      });

      return assignment;
    });

    return NextResponse.json({
      success: true,
      message: "Assignation supprimée avec succès",
      data: { assignment: result }
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'assignation:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Une erreur est survenue lors de la suppression de l'assignation"
      },
      { status: 500 }
    );
  }
}
