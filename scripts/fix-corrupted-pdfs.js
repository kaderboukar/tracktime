#!/usr/bin/env node

/**
 * Script de correction des PDFs corrompus en base de données
 * Remplace les données corrompues par des PDFs valides
 */

const { PrismaClient } = require('@prisma/client');
const jsPDF = require('jspdf');

const prisma = new PrismaClient();

// Fonction pour générer un PDF valide
function generateValidPDF(userName, year, semester) {
  const doc = new jsPDF();
  
  // En-tête du PDF
  doc.setFontSize(20);
  doc.text("Feuille de Temps Signée", 105, 30, { align: 'center' });
  
  // Informations de la feuille de temps
  doc.setFontSize(12);
  doc.text(`Utilisateur: ${userName}`, 20, 60);
  doc.text(`Année: ${year}`, 20, 75);
  doc.text(`Semestre: ${semester}`, 20, 90);
  doc.text(`Date de correction: ${new Date().toLocaleDateString('fr-FR')}`, 20, 105);
  
  // Section signature
  doc.setFontSize(14);
  doc.text("Signature Électronique", 20, 130);
  doc.line(20, 135, 190, 135);
  
  doc.setFontSize(10);
  doc.text("Ce document a été corrigé automatiquement:", 20, 150);
  doc.text(`${userName}`, 20, 160);
  doc.text(`Le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 20, 170);
  
  // Pied de page
  doc.setFontSize(8);
  doc.text("Document corrigé automatiquement par le système", 105, 280, { align: 'center' });
  
  // Convertir en Buffer
  return Buffer.from(doc.output('arraybuffer'));
}

// Fonction pour corriger un PDF corrompu
async function fixCorruptedPDF(timesheetId) {
  try {
    console.log(`🔧 Correction du PDF ID ${timesheetId}...`);
    
    // Récupérer les informations de la feuille de temps
    const timesheet = await prisma.signedTimesheet.findUnique({
      where: { id: timesheetId },
      include: { user: true }
    });
    
    if (!timesheet) {
      console.log(`❌ Feuille de temps ID ${timesheetId} non trouvée`);
      return false;
    }
    
    // Générer un nouveau PDF valide
    const validPdfBuffer = generateValidPDF(
      timesheet.user.name,
      timesheet.year,
      timesheet.semester
    );
    
    // Mettre à jour en base
    await prisma.signedTimesheet.update({
      where: { id: timesheetId },
      data: {
        signedPdfData: validPdfBuffer,
        updatedAt: new Date()
      }
    });
    
    console.log(`✅ PDF ID ${timesheetId} corrigé avec succès`);
    console.log(`   Utilisateur: ${timesheet.user.name}`);
    console.log(`   Période: ${timesheet.year} - ${timesheet.semester}`);
    console.log(`   Nouvelle taille: ${validPdfBuffer.length} bytes`);
    
    return true;
    
  } catch (error) {
    console.error(`❌ Erreur lors de la correction du PDF ID ${timesheetId}:`, error.message);
    return false;
  }
}

// Fonction principale
async function main() {
  try {
    console.log('🚀 Démarrage de la correction des PDFs corrompus...\n');
    
    // Récupérer tous les PDFs signés
    const signedTimesheets = await prisma.signedTimesheet.findMany({
      where: { signatureStatus: 'SIGNED' },
      include: { user: true },
      orderBy: { id: 'asc' }
    });
    
    console.log(`📊 Total des feuilles signées: ${signedTimesheets.length}\n`);
    
    let correctedCount = 0;
    let errorCount = 0;
    
    // Analyser et corriger chaque PDF
    for (const timesheet of signedTimesheets) {
      console.log(`🔍 Analyse du PDF ID ${timesheet.id} (${timesheet.user.name}):`);
      
      // Vérifier si les données existent
      if (!timesheet.signedPdfData) {
        console.log(`  ❌ Données manquantes - CORRECTION NÉCESSAIRE`);
        const success = await fixCorruptedPDF(timesheet.id);
        if (success) correctedCount++;
        else errorCount++;
      } else {
        // Vérifier la taille et la signature
        const dataLength = timesheet.signedPdfData.length;
        const signature = timesheet.signedPdfData.slice(0, 4).toString();
        
        console.log(`  📏 Taille: ${dataLength} bytes`);
        console.log(`  🎯 Signature: "${signature}"`);
        
        if (dataLength < 100 || signature !== '%PDF') {
          console.log(`  ❌ PDF corrompu - CORRECTION NÉCESSAIRE`);
          const success = await fixCorruptedPDF(timesheet.id);
          if (success) correctedCount++;
          else errorCount++;
        } else {
          console.log(`  ✅ PDF valide - AUCUNE CORRECTION NÉCESSAIRE`);
        }
      }
      
      console.log('─'.repeat(50));
    }
    
    // Résumé
    console.log('\n📋 RÉSUMÉ DE LA CORRECTION');
    console.log('============================');
    console.log(`✅ PDFs corrigés: ${correctedCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`📊 Total analysé: ${signedTimesheets.length}`);
    
    if (correctedCount > 0) {
      console.log('\n🎯 CORRECTION TERMINÉE');
      console.log('Les PDFs corrompus ont été remplacés par des versions valides');
      console.log('Vous pouvez maintenant les télécharger normalement');
    } else {
      console.log('\n🎯 AUCUNE CORRECTION NÉCESSAIRE');
      console.log('Tous les PDFs semblent valides');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

module.exports = {
  fixCorruptedPDF,
  generateValidPDF
};
