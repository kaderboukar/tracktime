import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { userId } = authResult;

    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        userId
      },
      include: {
        user: {
          select: {
            name: true,
            indice: true,
            grade: true,
            proformaCosts: true,
          },
        },
        project: {
          select: {
            name: true,
            projectNumber: true,
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
        error: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { userId: authenticatedUserId } = authResult;
    const data = await request.json();
    
    if (!data.userId || data.userId !== authenticatedUserId) {
      return NextResponse.json(
        { success: false, message: "Vous ne pouvez créer des entrées que pour vous-même" },
        { status: 403 }
      );
    }

    const timeEntry = await prisma.timeEntry.create({
      data: {
        userId: data.userId,
        projectId: data.projectId,
        activityId: data.activityId,
        hours: data.hours,
        semester: data.semester,
        year: data.year,
        comment: data.comment || undefined,
      },
      include: {
        user: {
          select: {
            name: true,
            indice: true,
          },
        },
        project: {
          select: {
            name: true,
            projectNumber: true,
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
      data: timeEntry,
    });

  } catch (error) {
    console.error("Erreur dans /api/time-entries:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur",
        error: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { userId: authenticatedUserId, role } = authResult;
    const data = await request.json();
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID manquant" },
        { status: 400 }
      );
    }

    // Vérifier si l'entrée existe et appartient à l'utilisateur
    const existingEntry = await prisma.timeEntry.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingEntry) {
      return NextResponse.json(
        { success: false, message: "Entrée non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur modifie sa propre entrée ou est admin
    if (existingEntry.userId !== authenticatedUserId && role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Vous ne pouvez modifier que vos propres entrées" },
        { status: 403 }
      );
    }

    const updatedEntry = await prisma.timeEntry.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            name: true,
            indice: true,
          },
        },
        project: {
          select: {
            name: true,
            projectNumber: true,
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
      data: updatedEntry,
    });

  } catch (error) {
    console.error("Erreur dans /api/time-entries:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur",
        error: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { userId: authenticatedUserId, role } = authResult;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID manquant" },
        { status: 400 }
      );
    }

    // Vérifier si l'entrée existe et appartient à l'utilisateur
    const existingEntry = await prisma.timeEntry.findUnique({
      where: { id: parseInt(id) },
      select: { userId: true },
    });

    if (!existingEntry) {
      return NextResponse.json(
        { success: false, message: "Entrée non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur supprime sa propre entrée ou est admin
    if (existingEntry.userId !== authenticatedUserId && role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Vous ne pouvez supprimer que vos propres entrées" },
        { status: 403 }
      );
    }

    await prisma.timeEntry.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      success: true,
      message: "Entrée supprimée avec succès",
    });

  } catch (error) {
    console.error("Erreur lors de la suppression de l'entrée de temps:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur",
        error: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}
