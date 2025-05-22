import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";

interface YearSemester {
  year: number;
  semesters: number[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { userId: authenticatedUserId, role } = authResult;
    const requestedUserId = parseInt(params.userId);

    // Vérifier que l'utilisateur demande ses propres données ou est admin
    if (requestedUserId !== authenticatedUserId && role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Vous ne pouvez consulter que vos propres entrées",
        },
        { status: 403 }
      );
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        userId: requestedUserId,
      },
      select: {
        year: true,
        semester: true,
      },
      distinct: ["year", "semester"],
      orderBy: [
        { year: "desc" },
        { semester: "desc" },
      ],
    });

    // Transformer les résultats en structure année/semestres
    const yearSemesters = timeEntries.reduce(
      (acc: YearSemester[], entry) => {
        const yearEntry = acc.find((y) => y.year === entry.year);
        const semester = Number(entry.semester);

        if (yearEntry) {
          if (!yearEntry.semesters.includes(semester)) {
            yearEntry.semesters.push(semester);
            yearEntry.semesters.sort((a, b) => b - a);
          }
        } else {
          acc.push({
            year: entry.year,
            semesters: [semester],
          });
        }
        return acc;
      },
      []
    );

    return NextResponse.json({
      success: true,
      data: yearSemesters,
    });
  } catch (error) {
    console.error("Erreur dans /api/time-entries/years-semesters:", error);
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