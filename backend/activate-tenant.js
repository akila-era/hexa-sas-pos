/**
 * Script to activate a tenant account
 * Usage: node activate-tenant.js <tenant-email-or-id>
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function activateTenant(identifier) {
  try {
    // Try to find tenant by email (from user) or by ID
    let tenant;
    
    // First, try to find by user email
    const user = await prisma.user.findUnique({
      where: { email: identifier },
      include: { tenant: true },
    });

    if (user && user.tenant) {
      tenant = user.tenant;
    } else {
      // Try to find by tenant ID
      tenant = await prisma.tenant.findUnique({
        where: { id: identifier },
      });
    }

    if (!tenant) {
      console.error(`❌ Tenant not found with identifier: ${identifier}`);
      console.log('\n💡 Try using:');
      console.log('   - User email address');
      console.log('   - Tenant ID (UUID)');
      process.exit(1);
    }

    if (tenant.isActive) {
      console.log(`✅ Tenant "${tenant.name}" is already active.`);
      process.exit(0);
    }

    // Activate the tenant
    const updated = await prisma.tenant.update({
      where: { id: tenant.id },
      data: { isActive: true },
    });

    console.log(`\n✅ Successfully activated tenant!`);
    console.log(`   Name: ${updated.name}`);
    console.log(`   ID: ${updated.id}`);
    console.log(`   Email: ${updated.email || 'N/A'}`);
    console.log(`   Status: ${updated.isActive ? 'Active' : 'Inactive'}`);
    console.log(`\n🎉 The tenant can now log in.`);

  } catch (error) {
    console.error('❌ Error activating tenant:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get identifier from command line arguments
const identifier = process.argv[2];

if (!identifier) {
  console.error('❌ Please provide a tenant identifier (email or ID)');
  console.log('\nUsage: node activate-tenant.js <tenant-email-or-id>');
  console.log('\nExample:');
  console.log('   node activate-tenant.js superadmin@example.com');
  console.log('   node activate-tenant.js 123e4567-e89b-12d3-a456-426614174000');
  process.exit(1);
}

activateTenant(identifier);



