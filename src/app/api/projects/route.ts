// app/api/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, staffAccess } from "@prisma/client";  // Ajouter staffAccess
import { authenticate } from "@/lib/auth";
import { projectSchema } from "@/lib/validation";
import { z } from "zod";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const authResult = authenticate(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const projects = await prisma.project.findMany({
      include: { users: { include: { user: true } } },
    });
    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json(
      { message: "Erreur serveur", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authResult = authenticate(req);
  if (authResult instanceof NextResponse) return authResult;

  const body = await req.json();
  const result = projectSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { message: "Données invalides", errors: result.error.format() },
      { status: 400 }
    );
  }

  const { name, projectNumber, staffAccess: staffAccessValue } = result.data;

  try {
    const existingProject = await prisma.project.findUnique({
      where: { projectNumber: projectNumber as string },
    });
    if (existingProject) {
      return NextResponse.json(
        { message: "Numéro de projet déjà utilisé" },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: { 
        name,
        projectNumber,
        projectType: "DEFAULT",  // Add default project type
        staffAccess: staffAccessValue as staffAccess  // Cast vers le type enum
      },
    });
    return NextResponse.json(project, { status: 201 });
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

  const body = await req.json();
  const updateSchema = projectSchema
    .partial()
    .extend({ id: z.number().int().positive("ID invalide") });
  const result = updateSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { message: "Données invalides", errors: result.error.format() },
      { status: 400 }
    );
  }

  const { id, name, projectNumber, projectType, staffAccess: staffAccessValue } = result.data as {
    id: number;
    name?: string;
    projectNumber?: string;
    projectType?: string;
    staffAccess?: staffAccess;  // Utiliser le type enum
  };

  try {
    const existingProject = await prisma.project.findUnique({ where: { id } });
    if (!existingProject) {
      return NextResponse.json(
        { message: "Projet non trouvé" },
        { status: 404 }
      );
    }

    if (projectNumber && projectNumber !== existingProject.projectNumber) {
      const numberTaken = await prisma.project.findUnique({
        where: { projectNumber },
      });
      if (numberTaken)
        return NextResponse.json(
          { message: "Numéro de projet déjà utilisé" },
          { status: 400 }
        );
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name: name || existingProject.name,
        projectNumber: projectNumber || existingProject.projectNumber,
        projectType: projectType || existingProject.projectType,
        staffAccess: staffAccessValue || existingProject.staffAccess,
      },
    });

    return NextResponse.json({
      message: "Projet mis à jour",
      project: updatedProject,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Erreur serveur", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const authResult = authenticate(req);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await req.json();
  if (!id || typeof id !== "number") {
    return NextResponse.json({ message: "ID invalide" }, { status: 400 });
  }

  try {
    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ message: "Projet supprimé" });
  } catch (error) {
    return NextResponse.json(
      { message: "Erreur serveur", error: (error as Error).message },
      { status: 500 }
    );
  }
}
