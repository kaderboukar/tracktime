// app/api/projects/users/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate, getUserIdFromToken } from "@/lib/auth";



interface AssignmentValidationResult {
  isValid: boolean;
  message?: string;
  currentTotal: number;
}

// Fonction de validation des assignations
async function validateAssignment(userId: number, newPercentage: number): Promise<AssignmentValidationResult> {
  const existingAssignments = await prisma.userProject.findMany({
    where: {
      userId,
    }
  });

  const currentTotal = existingAssignments.reduce(
    (sum, assignment) => sum + assignment.allocationPercentage,
    0
  );

  const newTotal = currentTotal + newPercentage;

  if (newTotal > 100) {
    return {
      isValid: false,
      message: `Le total des assignations (${newTotal}%) dépasserait 100%`,
      currentTotal
    };
  }

  return {
    isValid: true,
    currentTotal: newTotal,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params:  Promise<{ userId: string }> }
) {
  try {
    const authResult = await authenticate(req);
    if (authResult instanceof NextResponse) return authResult;

    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Token non fourni" },
        { status: 401 }
      );
    }

    const authenticatedUserId = await getUserIdFromToken(token);
    if (!authenticatedUserId) {
      return NextResponse.json(
        { success: false, message: "Token invalide" },
        { status: 401 }
      );
    }

    const { userId } = await params;
    const userIdNum = parseInt(userId);
    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { message: "ID utilisateur invalide" },
        { status: 400 }
      );
    }

    const userProjects = await prisma.userProject.findMany({
      where: { userId: userIdNum },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            projectNumber: true
          }
        }
      },
    });

    const totalAllocation = userProjects.reduce(
      (sum, project) => sum + project.allocationPercentage,
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        assignments: userProjects,
        totalAllocation,
        remainingAllocation: 100 - totalAllocation,
      }
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des projets:", error);
    return NextResponse.json(
      { message: "Erreur serveur", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const authResult = await authenticate(req);
    if (authResult instanceof NextResponse) return authResult;

    const { userId: userIdStr } = await params;
    const userId = parseInt(userIdStr);
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: "ID utilisateur invalide" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { projectId, allocationPercentage } = body;

    if (!projectId || typeof allocationPercentage !== 'number' || allocationPercentage <= 0 || allocationPercentage > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Les données d'assignation sont invalides"
        },
        { status: 400 }
      );
    }

    const validationResult = await validateAssignment(userId, allocationPercentage);

    if (!validationResult.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: validationResult.message,
          data: {
            currentTotal: validationResult.currentTotal,
          }
        },
        { status: 400 }
      );
    }

    const userProject = await prisma.userProject.create({
      data: {
        userId,
        projectId,
        allocationPercentage,
      },
      include: {
        project: {
          select: {
            name: true,
            projectNumber: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Assignation créée avec succès",
      data: {
        assignment: userProject,
        totalAllocation: validationResult.currentTotal,
        remainingAllocation: 100 - validationResult.currentTotal,
      }
    });

  } catch (error) {
    console.error("Erreur lors de la création de l'assignation:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Une erreur est survenue lors de la création de l'assignation"
      },
      { status: 500 }
    );
  }
}
