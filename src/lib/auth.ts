// lib/auth.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma";
import type { Role } from "@prisma/client";
import type { AuthResult } from "@/types/authorization";
//import { ASSIGNMENT_MANAGERS } from "@/types/authorization";

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

export async function authenticate(req: NextRequest): Promise<NextResponse | AuthResult> {
  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          message: "Format d'authentification invalide",
          detail: "Le token doit être au format 'Bearer <token>'",
        },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: "Token invalide" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Utilisateur non trouvé" },
        { status: 401 }
      );
    }

    return { userId: user.id, role: user.role };

  } catch (error) {
    console.error("Erreur lors de l'authentification:", error);
    return NextResponse.json(
      { success: false, message: "Erreur d'authentification" },
      { status: 401 }
    );
  }
}

export async function restrictTo(req: NextRequest, ...allowedRoles: Role[]): Promise<NextResponse | null> {
  try {
    const result = await authenticate(req);
    if (result instanceof NextResponse) return result;

    if (!allowedRoles.includes(result.role)) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Accès refusé. Vous n'avez pas les permissions nécessaires." 
        },
        { status: 403 }
      );
    }
    return null;
  } catch (error) {
    console.error("Erreur lors de la vérification des permissions:", error);
    return NextResponse.json(
      { success: false, message: "Erreur lors de la vérification des permissions" },
      { status: 500 }
    );
  }
}

export async function hasRole(userId: number, requiredRole: Role): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    return user?.role === requiredRole;
  } catch (error) {
    console.error("Erreur lors de la vérification du rôle:", error);
    return false;
  }
}
