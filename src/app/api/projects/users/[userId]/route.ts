// app/api/projects/users/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticate, getUserIdFromToken } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
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

    const userId = parseInt(params.userId);
    if (isNaN(userId)) {
      return NextResponse.json(
        { message: "ID utilisateur invalide" },
        { status: 400 }
      );
    }

    const userProjects = await prisma.userProject.findMany({
      where: { userId },
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

    return NextResponse.json(
      userProjects.map((up) => ({
        project: up.project,
        allocationPercentage: up.allocationPercentage,
        userId_projectId: `${up.userId}_${up.projectId}`,
      }))
    );
  } catch (error) {
    console.error("Erreur lors de la récupération des projets:", error);
    return NextResponse.json(
      { message: "Erreur serveur", error: (error as Error).message },
      { status: 500 }
    );
  }
}
