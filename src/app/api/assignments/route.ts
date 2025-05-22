import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token manquant" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const userId = await verifyToken(token);
    if (!userId) {
      return NextResponse.json({ error: "Token invalide" }, { status: 401 });
    }

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
