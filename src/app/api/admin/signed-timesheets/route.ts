import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SignatureStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticate(req);
    if (authResult instanceof NextResponse) return authResult;

    const { role } = authResult;

    // Vérifier que l'utilisateur est ADMIN ou PMSU
    if (role !== "ADMIN" && role !== "PMSU") {
      return NextResponse.json(
        { success: false, message: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Récupérer les paramètres de filtrage
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");
    const semester = searchParams.get("semester");
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");

    // Construire la clause where
    const whereClause: {
      year?: number;
      semester?: "S1" | "S2";
      signatureStatus?: SignatureStatus;
      userId?: number;
    } = {};

    if (year) {
      whereClause.year = parseInt(year);
    }
    if (semester) {
      whereClause.semester = semester as "S1" | "S2";
    }
    if (status) {
      whereClause.signatureStatus = status as SignatureStatus;
    }
    if (userId) {
      whereClause.userId = parseInt(userId);
    }

    // Récupérer toutes les feuilles de temps signées avec les informations utilisateur
    const signedTimesheets = await prisma.signedTimesheet.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            grade: true,
            role: true
          }
        }
      },
      orderBy: [
        { year: 'desc' },
        { semester: 'asc' },
        { user: { name: 'asc' } }
      ]
    });

    // Formater les données pour l'affichage
    const formattedTimesheets = signedTimesheets.map(timesheet => ({
      id: timesheet.id,
      userId: timesheet.userId,
      userName: timesheet.user.name,
      userEmail: timesheet.user.email,
      userGrade: timesheet.user.grade,
      userRole: timesheet.user.role,
      year: timesheet.year,
      semester: timesheet.semester,
      originalPdfPath: timesheet.originalPdfPath,
      hasSignedPdf: !!timesheet.signedPdfData,
      signatureDate: timesheet.signatureDate,
      signatureStatus: timesheet.signatureStatus,
      signatureToken: timesheet.signatureToken,
      expiresAt: timesheet.expiresAt,
      createdAt: timesheet.createdAt,
      updatedAt: timesheet.updatedAt
    }));

    return NextResponse.json({
      success: true,
      data: formattedTimesheets,
      total: formattedTimesheets.length
    });

  } catch (error) {
    console.error("Erreur lors de la récupération des feuilles de temps signées:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur lors de la récupération des feuilles de temps signées"
      },
      { status: 500 }
    );
  }
}
