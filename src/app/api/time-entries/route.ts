import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { sendTimeEntryNotification } from "@/lib/email";

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { userId: authenticatedUserId, role } = authResult;
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId");
    const year = searchParams.get("year");
    const semester = searchParams.get("semester");

    let whereClause: {
      userId?: number;
      status?: "APPROVED";
      year?: number;
      semester?: "S1" | "S2";
    };

    // Si un userId spécifique est demandé et que l'utilisateur est ADMIN/PMSU ou demande ses propres données
    if (requestedUserId) {
      const targetUserId = parseInt(requestedUserId);
      
      // Vérifier que l'utilisateur peut accéder à ces données
      if (role !== "ADMIN" && role !== "PMSU" && role !== "STAFF" && targetUserId !== authenticatedUserId) {
        return NextResponse.json(
          { success: false, message: "Accès non autorisé" },
          { status: 403 }
        );
      }

      // Pour un userId spécifique, retourner toutes les entrées (tous statuts)
      whereClause = { 
        userId: targetUserId,
        ...(year && semester ? {
          year: parseInt(year),
          semester: semester as "S1" | "S2"
        } : {})
      };
    } else {
      // Comportement par défaut : ADMIN/PMSU/STAFF voient tout pour la gestion des entrées
      whereClause = (role === "ADMIN" || role === "PMSU" || role === "STAFF")
        ? {
            ...(year && semester ? {
              year: parseInt(year),
              semester: semester as "S1" | "S2"
            } : {})
          }
        : { 
            userId: authenticatedUserId, 
            status: "APPROVED" as const,
            ...(year && semester ? {
              year: parseInt(year),
              semester: semester as "S1" | "S2"
            } : {})
          };
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            indice: true,
            grade: true,
            proformaCosts: {
              select: {
                year: true,
                cost: true
              }
            },
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
            createdAt: 'desc'
          }
        },
      },
      orderBy: [
        { year: 'desc' },
        { semester: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Transformer les données pour inclure le coût proforma de l'année spécifique
    const transformedEntries = timeEntries.map(entry => {
      const proformaCost = entry.user.proformaCosts?.find(cost => cost.year === entry.year)?.cost;
      return {
        ...entry,
        user: {
          ...entry.user,
          proformaCost,
          proformaCosts: undefined // Supprimer l'array proformaCosts car nous n'en avons plus besoin
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedEntries,
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

async function checkSemesterHours(userId: number, semester: "S1" | "S2", year: number, hoursToAdd: number = 0, userRole?: string) {
  // Pour les utilisateurs STAFF, ne compter que les entrées APPROVED
  // Pour ADMIN/PMSU, compter toutes les entrées
  const whereClause = (userRole === "ADMIN" || userRole === "PMSU")
    ? {
        userId,
        semester: semester as "S1" | "S2",
        year
      }
    : {
        userId,
        semester: semester as "S1" | "S2",
        year,
        status: "APPROVED" as const
      };

  const existingEntries = await prisma.timeEntry.findMany({
    where: whereClause,
    select: {
      hours: true
    }
  });

  const totalHours = existingEntries.reduce((sum, entry) => sum + entry.hours, 0) + hoursToAdd;
  return {
    totalHours,
    remainingHours: Math.max(0, 480 - totalHours)
  };
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { userId: authenticatedUserId, role } = authResult;
    const data = await request.json();

    if (!data.userId || data.userId !== authenticatedUserId) {
      return NextResponse.json(
        { success: false, message: "Vous ne pouvez créer des entrées que pour vous-même" },
        { status: 403 }
      );
    }

    // Vérifier la période active pour les utilisateurs STAFF
    if (role === "STAFF") {
      const activePeriod = await prisma.timePeriod.findFirst({
        where: { isActive: true }
      });

      if (!activePeriod) {
        return NextResponse.json(
          { success: false, message: "Aucune période de saisie active. Veuillez contacter l'administration." },
          { status: 400 }
        );
      }

      // Vérifier que l'année et le semestre correspondent à la période active
      if (data.year !== activePeriod.year || data.semester !== activePeriod.semester) {
        return NextResponse.json(
          { 
            success: false, 
            message: `Vous ne pouvez saisir des entrées que pour la période active : ${activePeriod.year} - ${activePeriod.semester}` 
          },
          { status: 400 }
        );
      }
    }

    // Vérifier les heures du semestre
    const { totalHours, remainingHours } = await checkSemesterHours(
      data.userId,
      data.semester,
      data.year,
      data.hours,
      role
    );

    if (totalHours > 480) {
      return NextResponse.json(
        {
          success: false,
          message: `Vous avez déjà ${totalHours - data.hours} heures pour ce semestre. Il vous reste ${remainingHours} heures disponibles.`
        },
        { status: 400 }
      );
    }

    // Créer ou récupérer la période de temps pour cette année/semestre
    const timePeriod = await prisma.timePeriod.upsert({
      where: {
        year_semester: {
          year: data.year,
          semester: data.semester
        }
      },
      update: {},
      create: {
        year: data.year,
        semester: data.semester,
        isActive: false // Par défaut non active
      }
    });

    const timeEntry = await prisma.timeEntry.create({
      data: {
        userId: data.userId,
        projectId: data.projectId,
        activityId: data.activityId,
        hours: data.hours,
        semester: data.semester,
        year: data.year,
        comment: data.comment || undefined,
        timePeriodId: timePeriod.id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
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
        timePeriod: {
          select: {
            id: true,
            year: true,
            semester: true,
          },
        },
      },
    });

    // Envoyer la notification email pour la nouvelle entrée de temps
    try {
      await sendTimeEntryNotification({
        userName: timeEntry.user.name,
        userEmail: timeEntry.user.email,
        projectName: timeEntry.project.name,
        activityName: timeEntry.activity.name,
        hours: timeEntry.hours,
        date: new Date().toLocaleDateString('fr-FR'),
        semester: timeEntry.semester,
        year: timeEntry.year,
        description: timeEntry.comment || undefined
      });
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de la notification d'entrée de temps:", emailError);
      // Ne pas faire échouer la création de l'entrée si l'email échoue
    }

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

    // Vérifier que l'utilisateur modifie sa propre entrée ou est admin/PMSU
    if (existingEntry.userId !== authenticatedUserId && role !== "ADMIN" && role !== "PMSU") {
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

    // Vérifier que l'utilisateur supprime sa propre entrée ou est admin/PMSU
    if (existingEntry.userId !== authenticatedUserId && role !== "ADMIN" && role !== "PMSU") {
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
