import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentification requise" },
        { status: 401 }
      );
    }

    const userId = await getUserIdFromToken(token);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Session invalide ou expirée" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        indice: true,
        grade: true,
        proformaCosts: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Erreur dans /api/auth/me:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur d'authentification",
      },
      { status: 401 }
    );
  }
}
