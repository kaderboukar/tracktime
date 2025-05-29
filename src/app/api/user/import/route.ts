import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { restrictTo } from "@/lib/auth";
import bcrypt from "bcrypt";
import * as z from "zod";

const prisma = new PrismaClient();

const userImportSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  name: z.string().min(1, "Le nom est requis"),
  indice: z.string().min(1, "L'indice est requis"),
  grade: z.string().min(1, "Le grade est requis"),
  type: z.enum(["OPERATION", "PROGRAMME", "SUPPORT"]),
  role: z.enum(["ADMIN", "PMSU", "MANAGEMENT", "STAFF"]),
  proformaCosts: z.array(z.object({
    year: z.number(),
    cost: z.number()
  }))
});

type ImportError = {
  row: number;
  message: string;
};

export async function POST(req: NextRequest) {
  const authError = await restrictTo(req, "ADMIN");
  if (authError) return authError;

  try {
    const { users } = await req.json();
    const errors: ImportError[] = [];
    const successfulImports = [];

    for (const [index, userData] of users.entries()) {
      try {
        // Valider les données
        const validationResult = userImportSchema.safeParse(userData);
        if (!validationResult.success) {
          errors.push({
            row: index + 1,
            message: "Données invalides: " + JSON.stringify(validationResult.error.format())
          });
          continue;
        }

        // Vérifier si l'email existe déjà
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email }
        });

        if (existingUser) {
          errors.push({
            row: index + 1,
            message: `L'email ${userData.email} est déjà utilisé`
          });
          continue;
        }

        // Vérifier si l'indice existe déjà
        const existingIndice = await prisma.user.findUnique({
          where: { indice: userData.indice }
        });

        if (existingIndice) {
          errors.push({
            row: index + 1,
            message: `L'indice ${userData.indice} est déjà utilisé`
          });
          continue;
        }

        // Créer l'utilisateur avec transaction
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = await prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              email: userData.email,
              password: hashedPassword,
              name: userData.name,
              indice: userData.indice,
              grade: userData.grade,
              type: userData.type,
              role: userData.role,
              isActive: true,
              signature: "",
            }
          });

          // Créer les coûts proforma
          if (userData.proformaCosts && Array.isArray(userData.proformaCosts)) {
            await tx.userProformaCost.createMany({
              data: userData.proformaCosts.map((cost: { year: number; cost: number }) => ({
                userId: newUser.id,
                year: cost.year,
                cost: cost.cost
              }))
            });
          }

          return newUser;
        });

        successfulImports.push(user);
      } catch (error) {
        errors.push({
          row: index + 1,
          message: `Erreur lors de l'importation: ${(error as Error).message}`
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${successfulImports.length} utilisateurs importés avec succès`,
      errors: errors.length > 0 ? errors : undefined,
      importedUsers: successfulImports
    });
  } catch (error) {
    console.error("Erreur lors de l'importation:", error);
    return NextResponse.json(
      { message: "Erreur lors de l'importation des utilisateurs" },
      { status: 500 }
    );
  }
}