/**
 * Ensure all tenants are active
 * Usage: node ensure-tenant-active.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function ensureTenantsActive() {
  try {
    console.log('\n🔧 Ensuring all tenants are active...\n');
    
    const tenants = await prisma.tenant.findMany({
      where: { isActive: false },
    });

    if (tenants.length === 0) {
      console.log('✅ All tenants are already active!');
      return;
    }

    console.log(`📋 Found ${tenants.length} inactive tenant(s):\n`);
    
    for (const tenant of tenants) {
      console.log(`   - ${tenant.name} (ID: ${tenant.id})`);
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { isActive: true },
      });
      console.log(`     ✅ Activated!`);
    }

    console.log(`\n✅ All tenants are now active!\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

ensureTenantsActive();



