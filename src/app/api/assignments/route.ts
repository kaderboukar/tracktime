import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request);

    // Si authResult est une instance de NextResponse, cela signifie qu'il y a une erreur d'authentification
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { userId } = authResult;

    const assignments = await prisma.userProject.findMany({
      where: {
        userId,
      },
      select: {
        projectId: true,
        userId: true,
        allocationPercentage: true,
        project: {
          select: {
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
        message: "Erreur serveur",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      },
      { status: 500 }
    );
  }
}
