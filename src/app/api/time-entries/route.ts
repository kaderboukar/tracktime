import { NextRequest, NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 }
      );
    }
    
    const userId = await verifyToken(token);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Token invalide" },
        { status: 401 }
      );
    }

    // Récupérer toutes les entrées de temps avec les relations
    const timeEntries = await prisma.timeEntry.findMany({
      include: {
        user: {
          select: {
            name: true,
            indice: true,
            grade: true,
            proformaCost: true,
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
        validationHistory: {
          include: {
            validator: {
              select: {
                name: true,
                indice: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, data: timeEntries });
  } catch (error) {
    console.error("Erreur lors de la récupération des entrées de temps:", error);
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const token = await getToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { userId, projectId, activityId, hours, semester, year, comment } = data;

    // Vérification des données requises
    if (!userId || !projectId || !activityId || !hours || !semester || !year) {
      return NextResponse.json(
        { success: false, message: "Données manquantes" },
        { status: 400 }
      );
    }

    // Vérification de l'existence de l'utilisateur, du projet et de l'activité
    const [user, project, activity] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.project.findUnique({ where: { id: projectId } }),
      prisma.activity.findUnique({ where: { id: activityId } }),
    ]);

    if (!user || !project || !activity) {
      return NextResponse.json(
        { success: false, message: "Données invalides" },
        { status: 400 }
      );
    }

    // Création de l'entrée de temps
    const timeEntry = await prisma.timeEntry.create({
      data: {
        userId,
        projectId,
        activityId,
        hours,
        semester,
        year,
        comment,
        status: 'PENDING',
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

    return NextResponse.json({ success: true, data: timeEntry });
  } catch (error) {
    console.error("Erreur lors de la création de l'entrée de temps:", error);
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const token = await getToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { id, status, ...updateData } = data;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID manquant" },
        { status: 400 }
      );
    }

    // Vérifier si l'entrée existe
    const existingEntry = await prisma.timeEntry.findUnique({
      where: { id },
    });

    if (!existingEntry) {
      return NextResponse.json(
        { success: false, message: "Entrée non trouvée" },
        { status: 404 }
      );
    }

    // Si un nouveau statut est fourni, créer un historique de validation
    if (status && status !== existingEntry.status) {
      await prisma.validationHistory.create({
        data: {
          timeEntryId: id,
          status,
          validatorId: token.userId,
          comment: data.comment,
        },
      });
    }

    // Mise à jour de l'entrée
    const updatedEntry = await prisma.timeEntry.update({
      where: { id },
      data: {
        ...updateData,
        ...(status && { status }),
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
        validationHistory: {
          include: {
            validator: {
              select: {
                name: true,
                indice: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: updatedEntry });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'entrée de temps:", error);
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const token = await getToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { id } = data;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID manquant" },
        { status: 400 }
      );
    }

    // Vérifier si l'entrée existe
    const existingEntry = await prisma.timeEntry.findUnique({
      where: { id },
    });

    if (!existingEntry) {
      return NextResponse.json(
        { success: false, message: "Entrée non trouvée" },
        { status: 404 }
      );
    }

    // Supprimer l'entrée et son historique de validation
    await prisma.$transaction([
      prisma.validationHistory.deleteMany({
        where: { timeEntryId: id },
      }),
      prisma.timeEntry.delete({
        where: { id },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'entrée de temps:", error);
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
