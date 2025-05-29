import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticate, restrictTo } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticate(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const userId = parseInt(id);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        indice: true,
        email: true,
        role: true,
        grade: true,
        proformaCosts: true,
        type: true,
        updatedAt: true,
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
    console.error("Erreur dans /api/user/[id]:", error);
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await restrictTo(req, "ADMIN");
  if (authError) return authError;

  const { id: idString } = await params;
  const id = parseInt(idString);
  if (!id || isNaN(id)) {
    return NextResponse.json(
      { message: "ID invalide" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        proformaCosts: true
      }
    });

    if (!existingUser) {
      return NextResponse.json(
        { message: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier l'email uniquement s'il est modifié
    if (body.email && body.email !== existingUser.email) {
      const emailTaken = await prisma.user.findFirst({
        where: {
          email: body.email,
          id: { not: id }
        }
      });
      if (emailTaken) {
        return NextResponse.json(
          { message: "Email déjà utilisé" },
          { status: 400 }
        );
      }
    }

    // Vérifier l'indice uniquement s'il est modifié
    if (body.indice && body.indice !== existingUser.indice) {
      const indiceTaken = await prisma.user.findFirst({
        where: {
          indice: body.indice,
          id: { not: id }
        }
      });
      if (indiceTaken) {
        return NextResponse.json(
          { message: "Indice déjà utilisé" },
          { status: 400 }
        );
      }
    }

    // Préparer les données de mise à jour de base
    const { proformaCosts, ...updateData } = body;
    updateData.updatedAt = new Date();
    delete updateData.id;

    // Mise à jour de l'utilisateur avec transaction pour gérer les coûts proforma
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Supprimer tous les anciens coûts proforma
      if (proformaCosts && Array.isArray(proformaCosts)) {
        await tx.userProformaCost.deleteMany({
          where: { userId: id }
        });

        // Créer les nouveaux coûts proforma
        await tx.userProformaCost.createMany({
          data: proformaCosts.map(cost => ({
            userId: id,
            year: cost.year,
            cost: cost.cost
          }))
        });
      }

      // Mettre à jour l'utilisateur
      return await tx.user.update({
        where: { id },
        data: updateData,
        include: {
          proformaCosts: true
        }
      });
    });

    return NextResponse.json({
      message: "Utilisateur mis à jour avec succès",
      user: updatedUser
    });
  } catch (error) {
    console.error("Erreur de mise à jour:", error);
    return NextResponse.json(
      { message: "Erreur lors de la mise à jour de l'utilisateur" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await restrictTo(req, "ADMIN");
  if (authError) return authError;

  try {
    const { id: idString } = await params;
    const id = parseInt(idString);

    if (!id || isNaN(id)) {
      return NextResponse.json(
        { message: "ID invalide" },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        timeEntries: true,
        proformaCosts: true,
        projects: true,
      }
    });

    if (!existingUser) {
      return NextResponse.json(
        { message: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier s'il y a des données liées
    const hasTimeEntries = existingUser.timeEntries.length > 0;
    const hasProjectAssignments = existingUser.projects.length > 0;

    if (hasTimeEntries || hasProjectAssignments) {
      return NextResponse.json(
        {
          message: "Impossible de supprimer cet utilisateur car il a des entrées de temps ou des assignations de projet. Vous pouvez le désactiver à la place."
        },
        { status: 400 }
      );
    }

    // Supprimer l'utilisateur et ses données liées dans une transaction
    await prisma.$transaction(async (tx) => {
      // Supprimer les coûts proforma
      await tx.userProformaCost.deleteMany({
        where: { userId: id }
      });

      // Supprimer l'utilisateur
      await tx.user.delete({
        where: { id }
      });
    });

    return NextResponse.json({
      message: "Utilisateur supprimé avec succès"
    });

  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error);

    // Gestion des erreurs de contrainte de clé étrangère
    if (error instanceof Error && error.message.includes('foreign key constraint')) {
      return NextResponse.json(
        {
          message: "Impossible de supprimer cet utilisateur car il est référencé dans d'autres données. Vous pouvez le désactiver à la place."
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: "Erreur lors de la suppression de l'utilisateur",
        error: process.env.NODE_ENV === "development" ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}
