import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { z } from "zod";

const assignmentSchema = z.object({
  userId: z.number(),
  projectId: z.number(),
  allocationPercentage: z.number().min(0).max(100),
});

interface AssignmentValidationResult {
  isValid: boolean;
  message?: string;
  currentTotal: number;
}

async function validateAssignment(
  userId: number,
  projectId: number,
  allocationPercentage: number
): Promise<AssignmentValidationResult> {
  const existingAssignments = await prisma.userProject.findMany({
    where: { userId },
  });

  const currentTotal = existingAssignments.reduce(
    (sum, assignment) => sum + assignment.allocationPercentage,
    0
  );

  const newTotal = currentTotal + allocationPercentage;

  if (newTotal > 100) {
    return {
      isValid: false,
      message: `Le total des assignations (${newTotal}%) dépasserait 100%`,
      currentTotal,
    };
  }

  return {
    isValid: true,
    currentTotal: newTotal,
  };
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticate(req);
    if (authResult instanceof NextResponse) return authResult;

    const { userId } = authResult;

    // Récupérer uniquement les assignations de l'utilisateur connecté
    const assignments = await prisma.userProject.findMany({
      where: {
        userId: userId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            projectNumber: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des assignations:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          "Une erreur est survenue lors de la récupération des assignations",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticate(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await req.json();
    const result = assignmentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: "Données invalides" },
        { status: 400 }
      );
    }

    const { userId, projectId, allocationPercentage } = body;

    // Valider l'assignation
    const validation = await validateAssignment(
      userId,
      projectId,
      allocationPercentage
    );

    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: validation.message },
        { status: 400 }
      );
    }

    // Créer l'assignation
    const assignment = await prisma.userProject.create({
      data: {
        userId,
        projectId,
        allocationPercentage,
      },
    });

    return NextResponse.json(
      { success: true, data: assignment },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Une erreur est survenue lors de la création de l'assignation",
      },
      { status: 500 }
    );
  }
}
