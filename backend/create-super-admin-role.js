/**
 * Create Super Admin Role for a tenant
 * Usage: node create-super-admin-role.js [tenant-id]
 * If tenant-id not provided, will create for System tenant
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSuperAdminRole(tenantId = null) {
  try {
    console.log('\n🔧 Creating Super Admin Role\n');
    console.log('='.repeat(50) + '\n');

    let tenant;

    // If tenant ID provided, find it
    if (tenantId) {
      tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        console.error(`❌ Tenant not found with ID: ${tenantId}`);
        process.exit(1);
      }
    } else {
      // Find or create System tenant
      tenant = await prisma.tenant.findFirst({
        where: { name: 'System' },
      });

      if (!tenant) {
        console.log('📦 Creating System tenant...');
        tenant = await prisma.tenant.create({
          data: {
            name: 'System',
            plan: 'SUPER_ADMIN',
            isActive: true,
            email: 'system@example.com',
          },
        });
        console.log('✅ System tenant created!');
      } else {
        console.log('✅ System tenant found');
      }
    }

    console.log(`\n📋 Tenant Details:`);
    console.log(`   Name: ${tenant.name}`);
    console.log(`   ID: ${tenant.id}`);
    console.log(`   Status: ${tenant.isActive ? 'Active' : 'Inactive'}\n`);

    // Check if Super Admin role already exists
    const existingRole = await prisma.role.findFirst({
      where: {
        tenantId: tenant.id,
        name: 'Super Admin',
      },
    });

    if (existingRole) {
      console.log('✅ Super Admin role already exists!');
      console.log(`   Role ID: ${existingRole.id}`);
      console.log(`   Role Name: ${existingRole.name}`);
      console.log(`   Created: ${existingRole.createdAt}`);
      console.log('\n💡 To create for a different tenant, provide tenant ID:');
      console.log('   node create-super-admin-role.js <tenant-id>\n');
      process.exit(0);
    }

    // Create Super Admin role
    console.log('📦 Creating Super Admin role...');
    const superAdminRole = await prisma.role.create({
      data: {
        tenantId: tenant.id,
        name: 'Super Admin',
      },
    });

    console.log('\n✅ Super Admin role created successfully!\n');
    console.log('='.repeat(50));
    console.log('\n📋 Role Details:');
    console.log(`   ID: ${superAdminRole.id}`);
    console.log(`   Name: ${superAdminRole.name}`);
    console.log(`   Tenant: ${tenant.name}`);
    console.log(`   Tenant ID: ${tenant.id}`);
    console.log(`   Created: ${superAdminRole.createdAt}`);
    console.log('\n🎉 Super Admin role is ready to use!\n');

  } catch (error) {
    console.error('\n❌ Error creating Super Admin role:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get tenant ID from command line arguments (optional)
const tenantId = process.argv[2] || null;

createSuperAdminRole(tenantId);



