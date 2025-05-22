import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticate(req);
    if (authResult instanceof NextResponse) return authResult;

    // Récupérer tous les utilisateurs et projets
    const [users, projects] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          indice: true
        }
      }),
      prisma.project.findMany({
        select: {
          id: true,
          name: true,
          projectNumber: true
        }
      })
    ]);

    // Créer un nouveau classeur Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Assignations');

    // Ajouter les en-têtes
    worksheet.columns = [
      { header: 'ID Utilisateur', key: 'userId', width: 15 },
      { header: 'Nom Utilisateur', key: 'userName', width: 30 },
      { header: 'Indice', key: 'indice', width: 15 },
      { header: 'ID Projet', key: 'projectId', width: 15 },
      { header: 'Nom Projet', key: 'projectName', width: 30 },
      { header: 'Numéro Projet', key: 'projectNumber', width: 20 },
      { header: 'Pourcentage (%)', key: 'allocationPercentage', width: 15 }
    ];

    // Ajouter les données
    users.forEach(user => {
      projects.forEach(project => {
        worksheet.addRow({
          userId: user.id,
          userName: user.name,
          indice: user.indice,
          projectId: project.id,
          projectName: project.name,
          projectNumber: project.projectNumber,
          allocationPercentage: ''
        });
      });
    });

    // Styliser les en-têtes
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Générer le buffer Excel
    const buffer = await workbook.xlsx.writeBuffer();

    // Retourner le fichier
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="modele_assignations.xlsx"'
      }
    });

  } catch (error) {
    console.error("Erreur lors de la génération du template:", error);
    return NextResponse.json(
      { message: "Erreur lors de la génération du template" },
      { status: 500 }
    );
  }
} 