import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import ExcelJS from "exceljs";

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticate(req);
    if (authResult instanceof NextResponse) return authResult;

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { message: "Aucun fichier n'a été fourni" },
        { status: 400 }
      );
    }

    // Lire le fichier Excel
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    
    const worksheet = workbook.getWorksheet('Assignations');
    if (!worksheet) {
      return NextResponse.json(
        { message: "Format de fichier invalide" },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      errors: [] as string[],
      total: 0
    };

    // Traiter chaque ligne (sauf l'en-tête)
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      results.total++;

      // Utiliser les numéros de colonnes au lieu des clés
      const userId = row.getCell(1).value; // Colonne A
      const projectId = row.getCell(4).value; // Colonne D
      const allocationPercentage = row.getCell(7).value; // Colonne G

      // Vérifier les données requises
      if (!userId || !projectId || !allocationPercentage) {
        results.errors.push(`Ligne ${rowNumber}: Données manquantes`);
        continue;
      }

      // Vérifier le format des données
      if (typeof allocationPercentage !== 'number' || 
          allocationPercentage <= 0 || 
          allocationPercentage > 100) {
        results.errors.push(`Ligne ${rowNumber}: Pourcentage invalide (doit être entre 1 et 100)`);
        continue;
      }

      try {
        // Vérifier si l'assignation existe déjà
        const existingAssignment = await prisma.userProject.findUnique({
          where: {
            userId_projectId: {
              userId: Number(userId),
              projectId: Number(projectId)
            }
          }
        });

        if (existingAssignment) {
          // Mettre à jour l'assignation existante
          await prisma.userProject.update({
            where: {
              userId_projectId: {
                userId: Number(userId),
                projectId: Number(projectId)
              }
            },
            data: {
              allocationPercentage: Number(allocationPercentage)
            }
          });
        } else {
          // Créer une nouvelle assignation
          await prisma.userProject.create({
            data: {
              userId: Number(userId),
              projectId: Number(projectId),
              allocationPercentage: Number(allocationPercentage)
            }
          });
        }
        results.success++;
      } catch (error) {
        results.errors.push(`Ligne ${rowNumber}: ${(error as Error).message}`);
      }
    }

    return NextResponse.json({
      message: "Import terminé",
      results
    });

  } catch (error) {
    console.error("Erreur lors de l'import:", error);
    return NextResponse.json(
      { message: "Erreur lors de l'import du fichier" },
      { status: 500 }
    );
  }
} 