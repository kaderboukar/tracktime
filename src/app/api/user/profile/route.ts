import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const authResult = authenticate(req);

  if (authResult instanceof NextResponse) return authResult;

  try {
    const userData = authenticate(req);
    const user = await prisma.user.findUnique({
      where: { id: userData.userId },
    });
    if (!user)
      return NextResponse.json(
        { message: "Utilisateur non trouvé" },
        { status: 404 }
      );

    return NextResponse.json({
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Erreur serveur", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {

  const authResult = authenticate(req);

  if (authResult instanceof NextResponse) return authResult;
  
  try {
    const userData = authenticate(req);
    const { name, email } = await req.json();

    const updatedUser = await prisma.user.update({
      where: { id: userData.userId },
      data: { name: name, email: email },
    });

    return NextResponse.json({
      message: "Profil mis à jour",
      user: updatedUser,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Erreur serveur", error: (error as Error).message },
      { status: 500 }
    );
  }
}
