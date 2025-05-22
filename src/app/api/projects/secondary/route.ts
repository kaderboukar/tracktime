import { NextResponse } from 'next/server';
import { PrismaClient } from "@prisma/client";
import { verifyToken } from '@/lib/auth';
import { type NextRequest } from 'next/server';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const verifiedUserId = await verifyToken(token);
    if (!verifiedUserId) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    // Récupération des projets non assignés à l'utilisateur avec gestion d'erreur améliorée
    const projects = await prisma.project.findMany({
      where: {
        users: {
          none: {
            userId: verifiedUserId
          }
        }
      },
      select: {
        id: true,
        name: true,
        projectNumber: true,
        projectType: true
      }
    }).catch(error => {
      console.error('Erreur Prisma:', error);
      throw new Error('Erreur base de données');
    });

    if (!projects) {
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(projects);

  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des projets' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
