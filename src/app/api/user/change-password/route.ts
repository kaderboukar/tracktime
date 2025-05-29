import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
  try {
    // Authentifier l'utilisateur
    const authResult = await authenticate(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { userId } = authResult;

    // Récupérer les données de la requête
    const body = await req.json();
    const { currentPassword, newPassword } = body;

    // Validation des données
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Le mot de passe actuel et le nouveau mot de passe sont requis" 
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Le nouveau mot de passe doit contenir au moins 6 caractères" 
        },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur avec son mot de passe actuel
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Le mot de passe actuel est incorrect" 
        },
        { status: 400 }
      );
    }

    // Vérifier que le nouveau mot de passe est différent de l'actuel
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Le nouveau mot de passe doit être différent du mot de passe actuel" 
        },
        { status: 400 }
      );
    }

    // Hasher le nouveau mot de passe
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Mettre à jour le mot de passe dans la base de données
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
        updatedAt: new Date(),
      },
    });

    // Log de sécurité (optionnel)
    console.log(`Mot de passe changé pour l'utilisateur: ${user.email} (ID: ${userId}) à ${new Date().toISOString()}`);

    return NextResponse.json({
      success: true,
      message: "Mot de passe changé avec succès",
    });

  } catch (error) {
    console.error("Erreur lors du changement de mot de passe:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur lors du changement de mot de passe",
        error: process.env.NODE_ENV === "development" ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}
