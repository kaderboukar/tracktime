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
        proformaCosts: {
          where: {
            year: new Date().getFullYear()
          },
          select: {
            cost: true,
            year: true
          }
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Ajouter le coût proforma de l'année courante directement dans l'objet user
    const currentYearCost = user.proformaCosts.find(cost => cost.year === new Date().getFullYear());
    const userWithProformaCost = {
      ...user,
      proformaCost: currentYearCost?.cost || null,
      proformaCosts: user.proformaCosts // Garder aussi la liste complète
    };

    return NextResponse.json({
      success: true,
      data: userWithProformaCost,
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
