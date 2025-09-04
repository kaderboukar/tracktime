import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from 'pdf-lib';
import * as fontkit from '@pdf-lib/fontkit';

export interface TimesheetData {
  userName: string;
  userGrade?: string;
  userProformaCost: number;
  totalHours: number;
  totalCalculatedCost: number;
  year: number;
  semester: string;
  timeEntries: Array<{
    projectName: string;
    activityName: string;
    hours: number;
    cost: number;
  }>;
  signatureInfo?: {
    signedBy: string;
    signedAt: Date;
    signatureToken: string;
  };
}

export interface PDFStyle {
  primaryColor: [number, number, number];
  secondaryColor: [number, number, number];
  textColor: [number, number, number];
  accentColor: [number, number, number];
  backgroundColor: [number, number, number];
}

// Nouvelles couleurs PNUD officielles
const PNUD_STYLES: PDFStyle = {
  primaryColor: [0.0, 0.4, 0.6],      // Bleu PNUD officiel
  secondaryColor: [0.95, 0.97, 0.98],  // Bleu très clair
  textColor: [0.1, 0.1, 0.1],          // Noir foncé
  accentColor: [0.0, 0.6, 0.4],        // Vert PNUD
  backgroundColor: [0.98, 0.98, 0.98]   // Blanc cassé
};

// Fonction utilitaire pour nettoyer le texte
function cleanText(text: unknown): string {
  if (!text) return 'N/A';
  return String(text).replace(/[^\x00-\x7F]/g, '').trim();
}

export async function generateTimesheetPDFWithPDFMaker(
  timesheetData: TimesheetData,
  styles: PDFStyle = PNUD_STYLES
): Promise<Uint8Array> {
  // Créer un nouveau document PDF
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  
  // Ajouter une page A4 portrait
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  
  // Charger les polices
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Marges et espacements améliorés
  const margin = 40;
  const contentWidth = width - (2 * margin);
  // const footerHeight = 50; // Non utilisé
  // const minBottomMargin = margin + footerHeight; // Non utilisé
  
  // === FOND DE PAGE ===
  await drawPageBackground(page, styles, width, height);
  
  // === EN-TÊTE AMÉLIORÉ ===
  const headerHeight = await drawEnhancedHeader(page, timesheetData, styles, margin, height - margin, font, boldFont, contentWidth);
  let currentY = height - margin - headerHeight - 40; // Plus d'espace entre l'en-tête et les infos staff
  
  // === INFORMATIONS UTILISATEUR RÉORGANISÉES ===
  const userInfoHeight = await drawEnhancedUserInfo(page, timesheetData, styles, margin, currentY, font, boldFont);
  currentY -= userInfoHeight + 30;
  
  // Pas de séparateur - aller directement au tableau
  currentY -= 10;
  
  // === TABLEAU DES ACTIVITÉS AMÉLIORÉ ===
  const tableHeight = await drawEnhancedActivitiesTable(page, timesheetData, styles, margin, currentY, font, boldFont, contentWidth);
  currentY -= tableHeight + 30;
  
  // === SECTION SIGNATURE EN BAS À DROITE ===
  // Positionner la signature en bas à droite de la page
  const signatureX = margin + contentWidth - 200; // 200px de largeur pour la signature
  const signatureY = margin + 80; // 80px du bas de la page
  
  if (timesheetData.signatureInfo) {
    await drawEnhancedSignature(page, timesheetData.signatureInfo, styles, signatureX, signatureY, font, boldFont);
  } else {
    await drawEnhancedSignaturePlaceholder(page, styles, signatureX, signatureY, font, boldFont);
  }
  
  // Pas de pied de page
  
  // Retourner le PDF comme buffer
  return await pdfDoc.save();
}

// === NOUVELLES FONCTIONS DE DESSIN ===

// Fonction non utilisée - commentée
// async function drawSectionSeparator(
//   page: PDFPage,
//   styles: PDFStyle,
//   x: number,
//   y: number,
//   width: number
// ): Promise<void> {
//   // Ligne de séparation simple
//   page.drawLine({
//     start: { x: x, y: y },
//     end: { x: x + width, y: y },
//     thickness: 1,
//     color: rgb(...styles.primaryColor),
//   });
// }

async function drawPageBackground(
  page: PDFPage,
  styles: PDFStyle,
  width: number,
  height: number
): Promise<void> {
  // Fond principal seulement (pas de barre bleue)
  page.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: height,
    color: rgb(...styles.backgroundColor),
  });
}

async function drawEnhancedHeader(
  page: PDFPage,
  data: TimesheetData,
  styles: PDFStyle,
  x: number,
  y: number,
  font: PDFFont,
  boldFont: PDFFont,
  contentWidth: number
): Promise<number> {
  // Logo PNUD réel en haut à droite - agrandi et mieux ajusté
  const logoWidth = 90;
  const logoHeight = 120;
  const logoX = x + contentWidth - logoWidth;
  
  try {
    // Charger le logo PNUD réel depuis le système de fichiers
    const fs = require('fs'); // eslint-disable-line @typescript-eslint/no-require-imports
    const path = require('path'); // eslint-disable-line @typescript-eslint/no-require-imports
    const logoPath = path.join(process.cwd(), 'public', 'logoundp.png');
    
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      const logoImage = await page.doc.embedPng(logoBytes);
      
      page.drawImage(logoImage, {
        x: logoX,
        y: y - logoHeight,
        width: logoWidth,
        height: logoHeight,
      });
      console.log('✅ Logo PNUD chargé avec succès');
    } else {
      throw new Error('Logo file not found');
    }
  } catch {
    console.log('Logo non trouvé, utilisation du texte PNUD');
    // Fallback si le logo n'est pas trouvé
    page.drawRectangle({
      x: logoX,
      y: y - logoHeight,
      width: logoWidth,
      height: logoHeight,
      color: rgb(...styles.primaryColor),
      borderColor: rgb(...styles.primaryColor),
      borderWidth: 2,
    });
    
    page.drawText("PNUD", {
      x: logoX + 15,
      y: y - 25,
      size: 14,
      font: boldFont,
      color: rgb(1, 1, 1),
    });
  }
  
  // Titre principal centré
  page.drawText("FICHE DE TEMPS", {
    x: x,
    y: y - 20,
    size: 16,
    font: boldFont,
    color: rgb(...styles.primaryColor),
  });
  
  // Informations de période
  page.drawText(`Période: ${data.year} - ${data.semester}`, {
    x: x,
    y: y - 40,
    size: 10,
    font: boldFont,
    color: rgb(...styles.accentColor),
  });
  
  // Retourner la hauteur utilisée par l'en-tête
  return 60;
}

async function drawEnhancedUserInfo(
  page: PDFPage,
  data: TimesheetData,
  styles: PDFStyle,
  x: number,
  y: number,
  font: PDFFont,
  boldFont: PDFFont,
  // _contentWidth: number // Non utilisé
): Promise<number> {
  // Titre de section avec taille réduite
  page.drawText("INFORMATIONS DU STAFF", {
    x: x,
    y: y,
    size: 12,
    font: boldFont,
    color: rgb(...styles.primaryColor),
  });
  
  y -= 25;
  
  // Informations en colonne unique - Coût Proforma en dessous de Grade
  const infoItems = [
    { label: "Nom", value: data.userName },
    { label: "Grade", value: data.userGrade || "N/A" },
    { label: "Coût Proforma", value: `${data.userProformaCost.toLocaleString('fr-FR')} USD` }
  ];
  
  // Affichage en colonne unique avec taille réduite
  infoItems.forEach((item, index) => {
    const itemY = y - (index * 18);
    
    page.drawText(`${item.label}:`, {
      x: x,
      y: itemY,
      size: 10,
      font: boldFont,
      color: rgb(...styles.textColor),
    });
    
    // Nettoyer et valider la valeur
    const cleanValue = cleanText(item.value);
    
    page.drawText(cleanValue, {
      x: x + 100,
      y: itemY,
      size: 10,
      font: font,
      color: rgb(...styles.textColor),
    });
  });
  
  // Retourner la hauteur utilisée par la section utilisateur (ajustée pour 3 lignes)
  return 60;
}

async function drawEnhancedActivitiesTable(
  page: PDFPage,
  data: TimesheetData,
  styles: PDFStyle,
  x: number,
  y: number,
  font: PDFFont,
  boldFont: PDFFont,
  tableWidth: number
): Promise<number> {
  // Pas de titre de section - aller directement au tableau
  y -= 10;
  
  // En-tête du tableau avec design amélioré
  const headerY = y;
  const columnWidths = [tableWidth * 0.35, tableWidth * 0.35, tableWidth * 0.15, tableWidth * 0.15];
  const columnX = [x, x + columnWidths[0], x + columnWidths[0] + columnWidths[1], x + columnWidths[0] + columnWidths[1] + columnWidths[2]];
  
  // Fond de l'en-tête avec dégradé
  page.drawRectangle({
    x: x,
    y: headerY - 20,
    width: tableWidth,
    height: 25,
    color: rgb(...styles.primaryColor),
  });
  
  // Texte de l'en-tête
  const headers = ["Projet", "Activité", "Heures", "Coût (USD)"];
  headers.forEach((header, index) => {
    page.drawText(header, {
      x: columnX[index] + 8,
      y: headerY - 10,
      size: 11,
      font: boldFont,
      color: rgb(1, 1, 1),
    });
  });
  
  y -= 45;
  
  // Lignes de données avec design alterné et espacement amélioré
  data.timeEntries.forEach((entry, index) => {
    const rowY = y - (index * 20);
    
    // Alternance de couleurs pour les lignes
    const rowColor = index % 2 === 0 ? rgb(...styles.secondaryColor) : rgb(1, 1, 1);
    
    page.drawRectangle({
      x: x,
      y: rowY - 15,
      width: tableWidth,
      height: 18,
      color: rowColor,
    });
    
    // Données de la ligne
    page.drawText(cleanText(entry.projectName), {
      x: columnX[0] + 8,
      y: rowY - 8,
      size: 10,
      font: font,
      color: rgb(...styles.textColor),
    });
    
    page.drawText(cleanText(entry.activityName), {
      x: columnX[1] + 8,
      y: rowY - 8,
      size: 10,
      font: font,
      color: rgb(...styles.textColor),
    });
    
    page.drawText(cleanText(`${entry.hours}h`), {
      x: columnX[2] + 8,
      y: rowY - 8,
      size: 10,
      font: font,
      color: rgb(...styles.textColor),
    });
    
    page.drawText(cleanText(`${Math.round(entry.cost).toLocaleString('fr-FR')}`), {
      x: columnX[3] + 8,
      y: rowY - 8,
      size: 10,
      font: font,
      color: rgb(...styles.textColor),
    });
  });
  
  // Ligne de total dans le tableau
  const totalRowY = y - (data.timeEntries.length * 20);
  
  // Fond de la ligne de total
  page.drawRectangle({
    x: x,
    y: totalRowY - 15,
    width: tableWidth,
    height: 18,
    color: rgb(...styles.primaryColor),
  });
  
  // Texte "TOTAL" en gras
  page.drawText("TOTAL", {
    x: columnX[0] + 8,
    y: totalRowY - 8,
    size: 10,
    font: boldFont,
    color: rgb(1, 1, 1),
  });
  
  // Total des heures
  page.drawText(cleanText(`${data.totalHours}h`), {
    x: columnX[2] + 8,
    y: totalRowY - 8,
    size: 10,
    font: boldFont,
    color: rgb(1, 1, 1),
  });
  
  // Total du coût
  page.drawText(cleanText(`${Math.round(data.totalCalculatedCost).toLocaleString('fr-FR')} USD`), {
    x: columnX[3] + 8,
    y: totalRowY - 8,
    size: 10,
    font: boldFont,
    color: rgb(1, 1, 1),
  });
  
  // Calculer la hauteur totale utilisée par le tableau (incluant la ligne de total)
  const tableHeight = 30 + 25 + ((data.timeEntries.length + 1) * 20) + 20; // titre + en-tête + lignes + ligne total + marge
  return tableHeight;
}

// Fonction non utilisée - commentée
// async function drawStyledTotals(
//   page: PDFPage,
//   data: TimesheetData,
//   styles: PDFStyle,
//   x: number,
//   y: number,
//   font: PDFFont,
//   boldFont: PDFFont
// ): Promise<number> {
//   // Titre "TOTAUX"
//   page.drawText("TOTAUX", {
//     x: x,
//     y: y,
//     size: 16,
//     font: boldFont,
//     color: rgb(...styles.accentColor),
//   });
//   
//   y -= 25;
//   
//   // Grille des totaux
//   page.drawText("Total Heures:", {
//     x: x,
//     y: y,
//     size: 14,
//     font: boldFont,
//     color: rgb(...styles.textColor),
//   });
//   
//   page.drawText(cleanText(`${data.totalHours}h`), {
//     x: x + 150,
//     y: y,
//     size: 14,
//     font: boldFont,
//     color: rgb(...styles.accentColor),
//   });
//   
//   y -= 20;
//   
//   page.drawText("Total Coût:", {
//     x: x,
//     y: y,
//     size: 14,
//     font: boldFont,
//     color: rgb(...styles.textColor),
//   });
//   
//   page.drawText(cleanText(`${Math.round(data.totalCalculatedCost).toLocaleString('fr-FR')} USD`), {
//     x: x + 150,
//     y: y,
//     size: 14,
//     font: boldFont,
//     color: rgb(...styles.accentColor),
//   });
//   
//   // Retourner la hauteur utilisée par la section totaux
//   return 60;
// }

async function drawEnhancedSignature(
  page: PDFPage,
  signatureInfo: {
    signedBy: string;
    signedAt: Date;
    signatureToken: string;
  },
  styles: PDFStyle,
  x: number,
  y: number,
  font: PDFFont,
  boldFont: PDFFont
): Promise<void> {
  // Texte "Signé électroniquement par" en vert
  page.drawText("Signé électroniquement par", {
    x: x,
    y: y,
    size: 10,
    font: boldFont,
    color: rgb(0, 0.6, 0.4), // Vert PNUD
  });
  
  y -= 15;
  
  // Nom de la personne qui a signé
  page.drawText(signatureInfo.signedBy, {
    x: x,
    y: y,
    size: 10,
    font: boldFont,
    color: rgb(0, 0.6, 0.4), // Vert PNUD
  });
  
  y -= 15;
  
  // Date de signature
  const signatureDate = signatureInfo.signedAt.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  page.drawText(`Le ${signatureDate}`, {
    x: x,
    y: y,
    size: 10,
    font: font,
    color: rgb(0, 0.6, 0.4), // Vert PNUD
  });
  
  y -= 15;
  
  // Ligne de signature
  page.drawLine({
    start: { x: x, y: y },
    end: { x: x + 150, y: y },
    thickness: 1,
    color: rgb(0, 0.6, 0.4), // Vert PNUD
  });
}

async function drawEnhancedSignaturePlaceholder(
  page: PDFPage,
  styles: PDFStyle,
  x: number,
  y: number,
  font: PDFFont,
  boldFont: PDFFont
): Promise<void> {
  // Texte "À signer électroniquement" en rouge
  page.drawText("À signer électroniquement", {
    x: x,
    y: y,
    size: 10,
    font: boldFont,
    color: rgb(0.8, 0.2, 0.2), // Rouge
  });
  
  y -= 15;
  
  // Ligne de signature
  page.drawLine({
    start: { x: x, y: y },
    end: { x: x + 150, y: y },
    thickness: 1,
    color: rgb(0.8, 0.2, 0.2), // Rouge
  });
}

// Fonction non utilisée - commentée
// async function drawStyledFooter(
//   page: PDFPage,
//   styles: PDFStyle,
//   x: number,
//   y: number,
//   font: PDFFont
// ): Promise<void> {
//   // Fond du footer
//   page.drawRectangle({
//     x: 0,
//     y: 0,
//     width: 595.28,
//     height: 40,
//     color: rgb(...styles.primaryColor),
//   });
//   
//   page.drawText(cleanText("Document généré automatiquement par le système UNDP Digital Hub"), {
//     x: x,
//     y: y,
//     size: 9,
//     font: font,
//     color: rgb(1, 1, 1),
//   });
//   
//   page.drawText(cleanText(`Généré le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`), {
//     x: x + 300,
//     y: y,
//     size: 9,
//     font: font,
//     color: rgb(1, 1, 1),
//   });
// }

// Fonction utilitaire pour créer un PDF avec signature
export async function createSignedTimesheetPDF(
  timesheetData: TimesheetData,
  signatureInfo: {
    signedBy: string;
    signedAt: Date;
    signatureToken: string;
  }
): Promise<Uint8Array> {
  const dataWithSignature = {
    ...timesheetData,
    signatureInfo
  };
  
  return await generateTimesheetPDFWithPDFMaker(dataWithSignature);
}

// Alias pour maintenir la compatibilité avec les routes existantes
export const generateTimesheetPDF = generateTimesheetPDFWithPDFMaker;
