import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST() {
  try {
    // Créer un utilisateur STAFF de test s'il n'existe pas
    const staffUser = await prisma.user.upsert({
      where: { email: 'staff@undp.org' },
      update: {},
      create: {
        email: 'staff@undp.org',
        password: await bcrypt.hash('Staff@123', 10),
        name: 'John Doe',
        indice: 'STAFF001',
        grade: 'G5',
        type: 'OPERATION',
        role: 'STAFF',
        signature: '/bk7.png',
        isActive: true,
      },
    });

    // Créer un coût proforma pour 2025
    const proformaCost = await prisma.userProformaCost.upsert({
      where: {
        userId_year: {
          userId: staffUser.id,
          year: 2025
        }
      },
      update: {},
      create: {
        userId: staffUser.id,
        year: 2025,
        cost: 75000, // 75,000 USD par an
      },
    });

    // Créer des projets de test
    const project1 = await prisma.project.upsert({
      where: { projectNumber: 'PROJ001' },
      update: {},
      create: {
        name: 'Projet Développement Durable',
        projectNumber: 'PROJ001',
        projectType: 'Programme',
        staffAccess: 'ALL',
      },
    });

    const project2 = await prisma.project.upsert({
      where: { projectNumber: 'PROJ002' },
      update: {},
      create: {
        name: 'Initiative Climat',
        projectNumber: 'PROJ002',
        projectType: 'Opération',
        staffAccess: 'OPERATION',
      },
    });

    // Créer des activités
    const activity1 = await prisma.activity.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Gestion de Projet',
        parentId: null,
      },
    });

    const activity2 = await prisma.activity.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: 'Planification',
        parentId: null,
      },
    });

    // Créer des entrées de temps APPROUVÉES
    const timeEntry1 = await prisma.timeEntry.upsert({
      where: { id: 1 },
      update: { status: 'APPROVED' }, // S'assurer qu'elle est approuvée
      create: {
        userId: staffUser.id,
        projectId: project1.id,
        activityId: activity1.id,
        semester: 'S1',
        year: 2025,
        hours: 25.5,
        status: 'APPROVED',
        comment: 'Planification du projet développement durable',
      },
    });

    const timeEntry2 = await prisma.timeEntry.upsert({
      where: { id: 2 },
      update: { status: 'APPROVED' }, // S'assurer qu'elle est approuvée
      create: {
        userId: staffUser.id,
        projectId: project2.id,
        activityId: activity2.id,
        semester: 'S1',
        year: 2025,
        hours: 18.0,
        status: 'APPROVED',
        comment: 'Analyse des données climatiques',
      },
    });

    // Créer une entrée pour 2024 aussi
    const timeEntry3 = await prisma.timeEntry.upsert({
      where: { id: 3 },
      update: { status: 'APPROVED' },
      create: {
        userId: staffUser.id,
        projectId: project1.id,
        activityId: activity1.id,
        semester: 'S2',
        year: 2024,
        hours: 40.0,
        status: 'APPROVED',
        comment: 'Travail sur projet 2024',
      },
    });

    // Créer un coût proforma pour 2024 aussi
    const proformaCost2024 = await prisma.userProformaCost.upsert({
      where: {
        userId_year: {
          userId: staffUser.id,
          year: 2024
        }
      },
      update: {},
      create: {
        userId: staffUser.id,
        year: 2024,
        cost: 70000, // 70,000 USD par an
      },
    });

    return NextResponse.json({
      success: true,
      message: "Données de test créées avec succès",
      data: {
        staffUser,
        proformaCosts: [proformaCost, proformaCost2024],
        projects: [project1, project2],
        activities: [activity1, activity2],
        timeEntries: [timeEntry1, timeEntry2, timeEntry3]
      }
    });

  } catch (error) {
    console.error("Erreur lors de la création des données de test:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur lors de la création des données de test",
        error: error instanceof Error ? error.message : "Erreur inconnue"
      },
      { status: 500 }
    );
  }
}
