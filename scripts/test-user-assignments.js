const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testUserAssignments() {
  try {
    console.log('🔍 Test des assignations par utilisateur...\n');

    // Lister tous les utilisateurs STAFF
    const staffUsers = await prisma.user.findMany({
      where: { role: 'STAFF' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    console.log('👥 Utilisateurs STAFF:');
    staffUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ID: ${user.id}`);
    });

    console.log('\n📋 Assignations par utilisateur:');

    for (const user of staffUsers) {
      const assignments = await prisma.userProject.findMany({
        where: { userId: user.id },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              projectNumber: true
            }
          }
        }
      });

      console.log(`\n🔗 ${user.name} (ID: ${user.id}):`);
      if (assignments.length === 0) {
        console.log('  ❌ Aucune assignation trouvée');
      } else {
        console.log(`  ✅ ${assignments.length} projet(s) assigné(s):`);
        assignments.forEach(assignment => {
          console.log(`    - ${assignment.project.name} (${assignment.project.projectNumber}) - ${assignment.allocationPercentage}%`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUserAssignments();
