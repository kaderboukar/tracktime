// lib/auth.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function getUserIdFromToken(token: string): Promise<number | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    
    if (!decoded || !decoded.userId) {
      console.error("Token invalide: userId manquant");
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true },
    });

    if (!user) {
      console.error("Utilisateur non trouvé pour le token");
      return null;
    }

    return user.id;
  } catch (error) {
    console.error("Erreur lors de la vérification du token:", error);
    return null;
  }
}

export async function authenticate(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        message: "Authentification requise",
        detail: "Le token d'authentification est manquant",
      },
      { status: 401 }
    );
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Token invalide",
          detail: "Le token ne contient pas les informations requises",
        },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Utilisateur non trouvé",
          detail: "L'utilisateur associé au token n'existe plus",
        },
        { status: 401 }
      );
    }

    return { userId: user.id, role: user.role };
  } catch (error) {
    console.error("Erreur d'authentification:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Session invalide ou expirée",
        detail: "Veuillez vous reconnecter",
      },
      { status: 401 }
    );
  }
}

export function restrictTo(role: string) {
  return async (req: NextRequest) => {
    const result = await authenticate(req);
    if (result instanceof NextResponse) return result;

    if (result.role !== role) {
      return NextResponse.json(
        { success: false, message: "Accès interdit" },
        { status: 403 }
      );
    }
    return null;
  };
}
