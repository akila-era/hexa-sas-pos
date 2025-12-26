/**
 * Quick script to activate the System tenant
 * Run this if you're having login issues with Super Admin accounts
 * 
 * Usage: node activate-system-tenant.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function activateSystemTenant() {
  try {
    console.log('\n🔧 Activating System Tenant...\n');

    // Find System tenant
    const systemTenant = await prisma.tenant.findFirst({
      where: {
        name: 'System'
      }
    });

    if (!systemTenant) {
      console.log('❌ System tenant not found!');
      process.exit(1);
    }

    console.log('📋 System Tenant Details:');
    console.log(`   ID: ${systemTenant.id}`);
    console.log(`   Name: ${systemTenant.name}`);
    console.log(`   Current Status: ${systemTenant.isActive ? 'Active' : 'Inactive'}\n`);

    if (systemTenant.isActive) {
      console.log('✅ System tenant is already active!\n');
      process.exit(0);
    }

    // Activate System tenant
    const updated = await prisma.tenant.update({
      where: { id: systemTenant.id },
      data: { isActive: true }
    });

    console.log('✅ System tenant activated successfully!\n');
    console.log('📋 Updated Details:');
    console.log(`   ID: ${updated.id}`);
    console.log(`   Name: ${updated.name}`);
    console.log(`   Status: ${updated.isActive ? 'Active' : 'Inactive'}\n`);
    console.log('🎉 You can now login with Super Admin accounts!\n');

  } catch (error) {
    console.error('\n❌ Error activating System tenant:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

activateSystemTenant();


