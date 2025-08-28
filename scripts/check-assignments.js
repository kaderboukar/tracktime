const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAssignments() {
  try {
    console.log('🔍 Vérification des assignations de projets...\n');

    // Vérifier les utilisateurs STAFF
    const staffUsers = await prisma.user.findMany({
      where: { role: 'STAFF' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    console.log(`👥 Utilisateurs STAFF trouvés: ${staffUsers.length}`);
    staffUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ID: ${user.id}`);
    });

    console.log('\n📋 Vérification des assignations par utilisateur:');

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

    // Vérifier tous les projets
    const allProjects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        projectNumber: true
      }
    });

    console.log(`\n📊 Projets disponibles: ${allProjects.length}`);
    allProjects.forEach(project => {
      console.log(`  - ${project.name} (${project.projectNumber}) - ID: ${project.id}`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAssignments();
