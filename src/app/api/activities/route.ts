// app/api/activities/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "@/lib/auth";
import { activitySchema } from "@/lib/validation";
import { z } from "zod";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const authResult = await authenticate(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const activities = await prisma.activity.findMany({
      include: {
        subActivities: true,
        parent: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(activities);
  } catch (error) {
    return NextResponse.json(
      { message: "Erreur serveur", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authResult = await authenticate(req);
  if (authResult instanceof NextResponse) return authResult;

  const body = await req.json();
  const result = activitySchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { message: "Données invalides", errors: result.error.format() },
      { status: 400 }
    );
  }

  const { name, parentId } = result.data;

  try {
    if (parentId) {
      const parent = await prisma.activity.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        return NextResponse.json(
          { message: "Activité parente non trouvée" },
          { status: 404 }
        );
      }
    }

    const activity = await prisma.activity.create({
      data: { name, parentId },
    });
    return NextResponse.json(
      { message: "Activité créée", activity },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Erreur serveur", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const authResult = await authenticate(req);
  if (authResult instanceof NextResponse) return authResult;

  const body = await req.json();
  const updateSchema = activitySchema
    .partial()
    .extend({ id: z.number().int().positive("ID invalide") });
  const result = updateSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { message: "Données invalides", errors: result.error.format() },
      { status: 400 }
    );
  }

  const { id, name, parentId } = result.data;

  try {
    const existingActivity = await prisma.activity.findUnique({
      where: { id },
    });
    if (!existingActivity) {
      return NextResponse.json(
        { message: "Activité non trouvée" },
        { status: 404 }
      );
    }

    if (parentId && parentId !== existingActivity.parentId) {
      const parent = await prisma.activity.findUnique({
        where: { id: parentId },
      });
      if (!parent)
        return NextResponse.json(
          { message: "Activité parente non trouvée" },
          { status: 404 }
        );
    }

    const updatedActivity = await prisma.activity.update({
      where: { id },
      data: {
        name: name || existingActivity.name,
        parentId: parentId !== undefined ? parentId : existingActivity.parentId,
      },
    });

    return NextResponse.json({
      message: "Activité mise à jour",
      activity: updatedActivity,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Erreur serveur", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const authResult = await authenticate(req);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await req.json();
  if (!id || typeof id !== "number") {
    return NextResponse.json({ message: "ID invalide" }, { status: 400 });
  }

  try {
    const activity = await prisma.activity.findUnique({ where: { id } });
    if (!activity) {
      return NextResponse.json(
        { message: "Activité non trouvée" },
        { status: 404 }
      );
    }

    await prisma.activity.delete({ where: { id } });
    return NextResponse.json({ message: "Activité supprimée" });
  } catch (error) {
    return NextResponse.json(
      { message: "Erreur serveur", error: (error as Error).message },
      { status: 500 }
    );
  }
}
