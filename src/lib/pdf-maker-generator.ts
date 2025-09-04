import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

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
  let currentY = height - margin;
  
  // === FOND DE PAGE ===
  await drawPageBackground(page, styles, width, height);
  
  // === EN-TÊTE AMÉLIORÉ ===
  await drawEnhancedHeader(page, timesheetData, styles, margin, currentY, font, boldFont);
  currentY -= 100;
  
  // === INFORMATIONS UTILISATEUR RÉORGANISÉES ===
  await drawEnhancedUserInfo(page, timesheetData, styles, margin, currentY, font, boldFont, contentWidth);
  currentY -= 80;
  
  // === TABLEAU DES ACTIVITÉS AMÉLIORÉ ===
  const tableEndY = await drawEnhancedActivitiesTable(page, timesheetData, styles, margin, currentY, font, boldFont, contentWidth);
  currentY = tableEndY - 50;
  
  // === TOTAUX STYLISÉS ===
  await drawStyledTotals(page, timesheetData, styles, margin, currentY, font, boldFont);
  currentY -= 80;
  
  // === SECTION SIGNATURE AMÉLIORÉE ===
  if (timesheetData.signatureInfo) {
    await drawEnhancedSignature(page, timesheetData.signatureInfo, styles, margin, currentY, font, boldFont);
  } else {
    await drawEnhancedSignaturePlaceholder(page, styles, margin, currentY, font, boldFont);
  }
  
  // === PIED DE PAGE STYLISÉ ===
  await drawStyledFooter(page, styles, margin, 30, font);
  
  // Retourner le PDF comme buffer
  return await pdfDoc.save();
}

// === NOUVELLES FONCTIONS DE DESSIN ===

async function drawPageBackground(
  page: PDFPage,
  styles: PDFStyle,
  width: number,
  height: number
): Promise<void> {
  // Fond principal
  page.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: height,
    color: rgb(...styles.backgroundColor),
  });
  
  // Bande décorative en haut
  page.drawRectangle({
    x: 0,
    y: height - 15,
    width: width,
    height: 15,
    color: rgb(...styles.primaryColor),
  });
}

async function drawEnhancedHeader(
  page: PDFPage,
  data: TimesheetData,
  styles: PDFStyle,
  x: number,
  y: number,
  font: PDFFont,
  boldFont: PDFFont
): Promise<void> {
  // Logo PNUD (rectangle stylisé en attendant le vrai logo)
  page.drawRectangle({
    x: x,
    y: y - 50,
    width: 80,
    height: 50,
    color: rgb(...styles.primaryColor),
    borderColor: rgb(...styles.primaryColor),
    borderWidth: 3,
  });
  
  // Texte "PNUD" dans le logo
  page.drawText("PNUD", {
    x: x + 20,
    y: y - 30,
    size: 16,
    font: boldFont,
    color: rgb(1, 1, 1),
  });
  
  // Titre principal avec ombre
  page.drawText("FICHE DE TEMPS", {
    x: x + 100,
    y: y - 20,
    size: 28,
    font: boldFont,
    color: rgb(...styles.primaryColor),
  });
  
  // Sous-titre
  page.drawText("UNDP Digital Hub - Système de Gestion des Temps", {
    x: x + 100,
    y: y - 40,
    size: 12,
    font: font,
    color: rgb(...styles.textColor),
  });
  
  // Informations de période
  page.drawText(`Période: ${data.year} - ${data.semester}`, {
    x: x + 100,
    y: y - 55,
    size: 14,
    font: boldFont,
    color: rgb(...styles.accentColor),
  });
}

async function drawEnhancedUserInfo(
  page: PDFPage,
  data: TimesheetData,
  styles: PDFStyle,
  x: number,
  y: number,
  font: PDFFont,
  boldFont: PDFFont,
  contentWidth: number
): Promise<void> {
  // Fond de la section
  page.drawRectangle({
    x: x - 10,
    y: y + 10,
    width: contentWidth + 20,
    height: 70,
    color: rgb(...styles.secondaryColor),
    borderColor: rgb(...styles.primaryColor),
    borderWidth: 1,
  });
  
  // Titre de section
  page.drawText("INFORMATIONS DE L'EMPLOYÉ", {
    x: x,
    y: y,
    size: 16,
    font: boldFont,
    color: rgb(...styles.primaryColor),
  });
  
  y -= 30;
  
  // Grille d'informations (2 colonnes)
  const leftColumn = [
    { label: "Nom", value: data.userName },
    { label: "Grade", value: data.userGrade || "N/A" }
  ];
  
  const rightColumn = [
    { label: "Période", value: `${data.year} - ${data.semester}` },
    { label: "Coût Proforma", value: `${data.userProformaCost.toLocaleString('fr-FR')} USD` }
  ];
  
  // Colonne gauche
  leftColumn.forEach((item, index) => {
    const itemY = y - (index * 20);
    
    page.drawText(`${item.label}:`, {
      x: x,
      y: itemY,
      size: 12,
      font: boldFont,
      color: rgb(...styles.textColor),
    });
    
    // Nettoyer et valider la valeur
    const cleanValue = cleanText(item.value);
    
    page.drawText(cleanValue, {
      x: x + 80,
      y: itemY,
      size: 12,
      font: font,
      color: rgb(...styles.textColor),
    });
  });
  
  // Colonne droite
  rightColumn.forEach((item, index) => {
    const itemY = y - (index * 20);
    
    page.drawText(`${item.label}:`, {
      x: x + 250,
      y: itemY,
      size: 12,
      font: boldFont,
      color: rgb(...styles.textColor),
    });
    
    // Nettoyer et valider la valeur
    const cleanValue = cleanText(item.value);
    
    page.drawText(cleanValue, {
      x: x + 330,
      y: itemY,
      size: 12,
      font: font,
      color: rgb(...styles.textColor),
    });
  });
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
  // Titre de section
  page.drawText("DÉTAIL DES ACTIVITÉS", {
    x: x,
    y: y,
    size: 16,
    font: boldFont,
    color: rgb(...styles.primaryColor),
  });
  
  y -= 30;
  
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
  
  // Lignes de données avec design alterné
  data.timeEntries.forEach((entry, index) => {
    const rowY = y - (index * 18);
    
    // Alternance de couleurs pour les lignes
    const rowColor = index % 2 === 0 ? rgb(...styles.secondaryColor) : rgb(1, 1, 1);
    
    page.drawRectangle({
      x: x,
      y: rowY - 12,
      width: tableWidth,
      height: 18,
      color: rowColor,
    });
    
    // Bordure subtile
    page.drawRectangle({
      x: x,
      y: rowY - 12,
      width: tableWidth,
      height: 18,
      color: rgb(0.9, 0.9, 0.9),
      borderColor: rgb(0.9, 0.9, 0.9),
      borderWidth: 0.5,
    });
    
    // Données de la ligne
    page.drawText(cleanText(entry.projectName), {
      x: columnX[0] + 8,
      y: rowY - 5,
      size: 10,
      font: font,
      color: rgb(...styles.textColor),
    });
    
    page.drawText(cleanText(entry.activityName), {
      x: columnX[1] + 8,
      y: rowY - 5,
      size: 10,
      font: font,
      color: rgb(...styles.textColor),
    });
    
    page.drawText(cleanText(`${entry.hours}h`), {
      x: columnX[2] + 8,
      y: rowY - 5,
      size: 10,
      font: font,
      color: rgb(...styles.textColor),
    });
    
    page.drawText(cleanText(`${Math.round(entry.cost).toLocaleString('fr-FR')}`), {
      x: columnX[3] + 8,
      y: rowY - 5,
      size: 10,
      font: font,
      color: rgb(...styles.textColor),
    });
  });
  
  return y - (data.timeEntries.length * 18);
}

async function drawStyledTotals(
  page: PDFPage,
  data: TimesheetData,
  styles: PDFStyle,
  x: number,
  y: number,
  font: PDFFont,
  boldFont: PDFFont
): Promise<void> {
  // Fond de la section totaux
  page.drawRectangle({
    x: x - 10,
    y: y + 10,
    width: 300,
    height: 60,
    color: rgb(...styles.secondaryColor),
    borderColor: rgb(...styles.accentColor),
    borderWidth: 2,
  });
  
  // Ligne de séparation stylisée
  page.drawLine({
    start: { x: x, y: y + 10 },
    end: { x: x + 280, y: y + 10 },
    thickness: 3,
    color: rgb(...styles.accentColor),
  });
  
  y -= 15;
  
  // Titre "TOTAUX"
  page.drawText("TOTAUX", {
    x: x,
    y: y,
    size: 16,
    font: boldFont,
    color: rgb(...styles.accentColor),
  });
  
  y -= 25;
  
  // Grille des totaux
  page.drawText("Total Heures:", {
    x: x,
    y: y,
    size: 14,
    font: boldFont,
    color: rgb(...styles.textColor),
  });
  
  page.drawText(cleanText(`${data.totalHours}h`), {
    x: x + 150,
    y: y,
    size: 14,
    font: boldFont,
    color: rgb(...styles.accentColor),
  });
  
  y -= 20;
  
  page.drawText("Total Coût:", {
    x: x,
    y: y,
    size: 14,
    font: boldFont,
    color: rgb(...styles.textColor),
  });
  
  page.drawText(cleanText(`${Math.round(data.totalCalculatedCost).toLocaleString('fr-FR')} USD`), {
    x: x + 150,
    y: y,
    size: 14,
    font: boldFont,
    color: rgb(...styles.accentColor),
  });
}

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
  // Fond de la section signature
  page.drawRectangle({
    x: x - 10,
    y: y + 10,
    width: 400,
    height: 80,
    color: rgb(0.95, 1, 0.95), // Vert très clair
    borderColor: rgb(...styles.accentColor),
    borderWidth: 2,
  });
  
  page.drawText("SIGNATURE ÉLECTRONIQUE", {
    x: x,
    y: y,
    size: 16,
    font: boldFont,
    color: rgb(...styles.accentColor),
  });
  
  y -= 25;
  
  page.drawText(cleanText(`Signé par: ${signatureInfo.signedBy}`), {
    x: x,
    y: y,
    size: 12,
    font: font,
    color: rgb(...styles.textColor),
  });
  
  y -= 18;
  
  page.drawText(cleanText(`Date: ${signatureInfo.signedAt.toLocaleDateString('fr-FR')}`), {
    x: x,
    y: y,
    size: 12,
    font: font,
    color: rgb(...styles.textColor),
  });
  
  y -= 18;
  
  page.drawText(cleanText(`Token: ${signatureInfo.signatureToken}`), {
    x: x,
    y: y,
    size: 10,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  // Ligne de signature stylisée
  y -= 20;
  page.drawLine({
    start: { x: x, y: y },
    end: { x: x + 300, y: y },
    thickness: 2,
    color: rgb(...styles.accentColor),
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
  // Fond de la section signature
  page.drawRectangle({
    x: x - 10,
    y: y + 10,
    width: 400,
    height: 80,
    color: rgb(1, 0.95, 0.95), // Rouge très clair
    borderColor: rgb(0.8, 0.2, 0.2),
    borderWidth: 2,
  });
  
  page.drawText("SIGNATURE REQUISE", {
    x: x,
    y: y,
    size: 16,
    font: boldFont,
    color: rgb(0.8, 0.2, 0.2),
  });
  
  y -= 25;
  
  page.drawText("À signer électroniquement", {
    x: x,
    y: y,
    size: 12,
    font: font,
    color: rgb(0.6, 0.6, 0.6),
  });
  
  y -= 18;
  
  page.drawText("Cliquez sur le lien de signature dans l'email", {
    x: x,
    y: y,
    size: 10,
    font: font,
    color: rgb(0.6, 0.6, 0.6),
  });
  
  // Ligne de signature stylisée
  y -= 20;
  page.drawLine({
    start: { x: x, y: y },
    end: { x: x + 300, y: y },
    thickness: 2,
    color: rgb(0.8, 0.2, 0.2),
  });
}

async function drawStyledFooter(
  page: PDFPage,
  styles: PDFStyle,
  x: number,
  y: number,
  font: PDFFont
): Promise<void> {
  // Fond du footer
  page.drawRectangle({
    x: 0,
    y: 0,
    width: 595.28,
    height: 40,
    color: rgb(...styles.primaryColor),
  });
  
  page.drawText(cleanText("Document généré automatiquement par le système UNDP Digital Hub"), {
    x: x,
    y: y,
    size: 9,
    font: font,
    color: rgb(1, 1, 1),
  });
  
  page.drawText(cleanText(`Généré le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`), {
    x: x + 300,
    y: y,
    size: 9,
    font: font,
    color: rgb(1, 1, 1),
  });
}

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
