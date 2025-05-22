import { NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";
import { getToken } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const token = await getToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 }
      );
    }

    const userId = parseInt(params.userId);
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: "ID utilisateur invalide" },
        { status: 400 }
      );
    }

    // Récupérer toutes les combinaisons uniques année/semestre pour l'utilisateur
    const yearSemesters = await prisma.timeEntry.findMany({
      where: { userId },
      distinct: ['year', 'semester'],
      select: {
        year: true,
        semester: true,
      },
      orderBy: [
        { year: 'desc' },
        { semester: 'desc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: yearSemesters,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des années/semestres:", error);
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}