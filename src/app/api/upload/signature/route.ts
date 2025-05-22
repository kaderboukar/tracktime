import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  const authResult = authenticate(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const formData = await req.formData();
    const file = formData.get('signature') as File;
    
    if (!file) {
      return NextResponse.json(
        { message: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { message: 'Format de fichier non supporté' },
        { status: 400 }
      );
    }

    // Vérifier la taille du fichier (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { message: 'Le fichier est trop volumineux' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Définir le chemin du dossier signatures
    const uploadsDir = path.join(process.cwd(), 'public', 'signatures');
    
    try {
      // Créer le dossier s'il n'existe pas
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      console.error('Erreur création dossier:', error);
    }

    // Générer un nom de fichier unique avec l'extension originale
    const uniqueFilename = `${uuidv4()}${path.extname(file.name)}`;
    const filePath = path.join(uploadsDir, uniqueFilename);
    
    try {
      await writeFile(filePath, buffer);
    } catch (error) {
      console.error('Erreur écriture fichier:', error);
      throw new Error('Erreur lors de l\'enregistrement du fichier');
    }
    
    // Retourner l'URL relative
    const signatureUrl = `/signatures/${uniqueFilename}`;

    return NextResponse.json({ signatureUrl });
  } catch (error) {
    console.error('Erreur lors du téléversement:', error);
    return NextResponse.json(
      { message: 'Erreur lors du téléversement: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
