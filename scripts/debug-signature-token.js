#!/usr/bin/env node

/**
 * Script de diagnostic pour les tokens de signature
 * Aide à identifier les problèmes avec les tokens de signature
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugSignatureTokens() {
  console.log('🔍 Diagnostic des tokens de signature\n');
  
  try {
    // 1. Vérifier tous les tokens de signature existants
    console.log('1️⃣ Vérification des tokens de signature existants...');
    const signedTimesheets = await prisma.signedTimesheet.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            grade: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`📊 Nombre total de feuilles de temps signées: ${signedTimesheets.length}\n`);
    
    if (signedTimesheets.length === 0) {
      console.log('❌ Aucune feuille de temps signée trouvée dans la base de données');
      console.log('💡 Cela peut expliquer l\'erreur "Token de signature invalide"');
      return;
    }
    
    // 2. Analyser chaque token
    console.log('2️⃣ Analyse des tokens de signature:');
    console.log('=' .repeat(80));
    
    signedTimesheets.forEach((sheet, index) => {
      const isExpired = new Date() > sheet.expiresAt;
      const status = sheet.signatureStatus;
      const daysUntilExpiry = Math.ceil((sheet.expiresAt - new Date()) / (1000 * 60 * 60 * 24));
      
      console.log(`\n📋 Feuille ${index + 1}:`);
      console.log(`   👤 Utilisateur: ${sheet.user.name} (${sheet.user.email})`);
      console.log(`   📅 Période: ${sheet.year} - ${sheet.semester}`);
      console.log(`   🔑 Token: ${sheet.signatureToken.substring(0, 20)}...`);
      console.log(`   📊 Statut: ${status}`);
      console.log(`   ⏰ Expire: ${sheet.expiresAt.toLocaleDateString('fr-FR')}`);
      console.log(`   🚨 Expiré: ${isExpired ? 'OUI' : 'NON'}`);
      console.log(`   📈 Jours restants: ${daysUntilExpiry}`);
      
      if (isExpired) {
        console.log(`   ⚠️  ATTENTION: Ce token est expiré !`);
      }
      
      if (status === 'PENDING') {
        console.log(`   ✅ Ce token est valide et en attente de signature`);
      }
    });
    
    // 3. Vérifier les tokens valides
    console.log('\n3️⃣ Tokens valides (non expirés et en attente):');
    const validTokens = signedTimesheets.filter(sheet => 
      new Date() <= sheet.expiresAt && sheet.signatureStatus === 'PENDING'
    );
    
    if (validTokens.length === 0) {
      console.log('❌ Aucun token valide trouvé');
      console.log('💡 Tous les tokens sont soit expirés, soit déjà signés');
    } else {
      console.log(`✅ ${validTokens.length} token(s) valide(s) trouvé(s):`);
      validTokens.forEach((sheet, index) => {
        console.log(`   ${index + 1}. ${sheet.user.name} - ${sheet.year} ${sheet.semester}`);
        console.log(`      Token: ${sheet.signatureToken}`);
        console.log(`      Lien: http://localhost:3000/api/timesheet/sign?token=${sheet.signatureToken}`);
      });
    }
    
    // 4. Recommandations
    console.log('\n4️⃣ Recommandations:');
    console.log('=' .repeat(50));
    
    if (signedTimesheets.length === 0) {
      console.log('🔧 Actions à effectuer:');
      console.log('   1. Générer une nouvelle feuille de temps via l\'interface');
      console.log('   2. Vérifier que l\'email de signature est envoyé');
      console.log('   3. Utiliser le lien dans l\'email pour signer');
    } else if (validTokens.length === 0) {
      console.log('🔧 Actions à effectuer:');
      console.log('   1. Générer une nouvelle feuille de temps');
      console.log('   2. Les anciens tokens sont expirés ou déjà signés');
    } else {
      console.log('✅ Des tokens valides sont disponibles');
      console.log('💡 Utilisez les liens ci-dessus pour tester la signature');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le diagnostic
if (require.main === module) {
  debugSignatureTokens().catch(console.error);
}

module.exports = { debugSignatureTokens };
