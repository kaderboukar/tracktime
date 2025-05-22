import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Token manquant" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const userId = await verifyToken(token);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Token invalide" },
        { status: 401 }
      );
    }

    const timeEntries = await prisma.timeEntry.findMany({
      include: {
        user: {
          select: {
            name: true,
            indice: true,
            grade: true,
            proformaCost: true,
            type: true,
          },
        },
        project: {
          select: {
            name: true,
            projectNumber: true,
            staffAccess: true,
            projectType: true,
          },
        },
        activity: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: timeEntries,
    });
  } catch (error) {
    console.error("Erreur dans /api/time-entries:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 }
    );
  }
}