// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticate, restrictTo } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const authResult = authenticate(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        indice: true,
        grade: true,
        proformaCosts: true,
        role: true,
        type: true,
        isActive: true,  // Ajout du champ isActive
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json(
      { message: "Erreur serveur", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authError = restrictTo("ADMIN")(req);
  if (authError) return authError;

  const body = await req.json();
  const result = registerSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { message: "Données invalides", errors: result.error.format() },
      { status: 400 }
    );
  }

  const { email, password, name, indice, grade, type, role, proformaCosts, signature, isActive } = body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { message: "Email déjà utilisé" },
        { status: 400 }
      );
    }

    const existingIndice = await prisma.user.findUnique({ where: { indice } });
    if (existingIndice) {
      return NextResponse.json(
        { message: "Indice déjà utilisé" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Création de l'utilisateur avec transaction pour gérer les coûts proforma
    const user = await prisma.$transaction(async (tx) => {
      // Créer l'utilisateur
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          indice,
          grade,
          type: type || "OPERATION",
          role: role || "STAFF",
          isActive: isActive ?? true,
          signature: signature || "",
        },
      });

      // Ajouter les coûts proforma
      if (proformaCosts && Array.isArray(proformaCosts)) {
        await tx.userProformaCost.createMany({
          data: proformaCosts.map(cost => ({
            userId: newUser.id,
            year: cost.year,
            cost: cost.cost
          }))
        });
      }

      // Retourner l'utilisateur avec ses coûts proforma
      return await tx.user.findUnique({
        where: { id: newUser.id },
        include: {
          proformaCosts: true
        }
      });
    });

    return NextResponse.json(
      { message: "Utilisateur créé", user },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    return NextResponse.json(
      { message: "Erreur serveur", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const authError = restrictTo("ADMIN")(req);
  if (authError) return authError;

  const url = new URL(req.url);
  const id = parseInt(url.pathname.split('/').pop() || '');
  const body = await req.json();

  if (!id || isNaN(id)) {
    return NextResponse.json(
      { message: "ID invalide ou manquant" },
      { status: 400 }
    );
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json(
        { message: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier l'email uniquement s'il est modifié
    if (body.email && body.email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({ 
        where: { 
          email: body.email,
          NOT: { id }
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
      const indiceTaken = await prisma.user.findUnique({ 
        where: { 
          indice: body.indice,
          NOT: { id }
        } 
      });
      if (indiceTaken) {
        return NextResponse.json(
          { message: "Indice déjà utilisé" },
          { status: 400 }
        );
      }
    }

    // Préparer les données de mise à jour
    const updateData: Partial<{
      email: string;
      name: string;
      indice: string;
      grade: string;
      proformaCost: { set: number };
      type: string;
      role: string;
      isActive: boolean;
      password: string;
    }> = {
      email: body.email || existingUser.email,
      name: body.name || existingUser.name,
      indice: body.indice || existingUser.indice,
      grade: body.grade || existingUser.grade,
      proformaCost: body.proformaCost !== undefined ? { set: body.proformaCost } : undefined,
      type: body.type || existingUser.type,
      role: body.role || existingUser.role,
      isActive: body.isActive !== undefined ? body.isActive : existingUser.isActive,  // Ajout du champ isActive
    };

    // Gérer le mot de passe uniquement s'il est fourni
    if (body.password) {
      updateData.password = await bcrypt.hash(body.password, 10);
    }

    // Mettre à jour les coûts proforma
    if (body.proformaCosts) {
      // Supprimer les anciens coûts
      await prisma.userProformaCost.deleteMany({
        where: { userId: id }
      });
      
      // Créer les nouveaux coûts
      interface ProformaCost {
        year: number;
        cost: number;
      }

            await prisma.userProformaCost.createMany({
              data: body.proformaCosts.map((cost: ProformaCost) => ({
                userId: id,
                year: cost.year,
                cost: cost.cost
              }))
            });
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id },
      include: {
        proformaCosts: true
      }
    });

    return NextResponse.json({
      message: "Utilisateur mis à jour avec succès",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Erreur de mise à jour:", error);
    return NextResponse.json(
      { message: "Erreur lors de la mise à jour de l'utilisateur" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const authError = restrictTo("ADMIN")(req);
  if (authError) return authError;

  const { id } = await req.json();
  if (!id || typeof id !== "number") {
    return NextResponse.json({ message: "ID invalide" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json(
        { message: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ message: "Utilisateur supprimé" });
  } catch (error) {
    return NextResponse.json(
      { message: "Erreur serveur", error: (error as Error).message },
      { status: 500 }
    );
  }
}
