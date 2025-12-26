/**
 * Create a new role for a tenant
 * Usage: 
 *   node create-role.js <role-name> [tenant-id]
 *   node create-role.js "Super Admin"  (creates for System tenant)
 *   node create-role.js "Manager" <tenant-id>  (creates for specific tenant)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createRole(roleName, tenantId = null) {
  try {
    console.log('\n🔧 Creating Role\n');
    console.log('='.repeat(50) + '\n');

    if (!roleName) {
      console.error('❌ Role name is required!');
      console.log('\nUsage:');
      console.log('   node create-role.js <role-name> [tenant-id]');
      console.log('\nExamples:');
      console.log('   node create-role.js "Super Admin"');
      console.log('   node create-role.js "Manager" <tenant-id>');
      console.log('   node create-role.js "Admin" <tenant-id>\n');
      process.exit(1);
    }

    let tenant;

    // If tenant ID provided, find it
    if (tenantId) {
      tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        console.error(`❌ Tenant not found with ID: ${tenantId}`);
        console.log('\n💡 Available tenants:');
        const allTenants = await prisma.tenant.findMany({
          select: { id: true, name: true, isActive: true },
        });
        allTenants.forEach(t => {
          console.log(`   - ${t.name} (ID: ${t.id}, Active: ${t.isActive ? 'Yes' : 'No'})`);
        });
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
        console.log('✅ Using System tenant');
      }
    }

    console.log(`\n📋 Tenant Details:`);
    console.log(`   Name: ${tenant.name}`);
    console.log(`   ID: ${tenant.id}`);
    console.log(`   Status: ${tenant.isActive ? 'Active' : 'Inactive'}\n`);

    // Check if role already exists
    const existingRole = await prisma.role.findFirst({
      where: {
        tenantId: tenant.id,
        name: roleName,
      },
    });

    if (existingRole) {
      console.log(`⚠️  Role "${roleName}" already exists for this tenant!`);
      console.log(`   Role ID: ${existingRole.id}`);
      console.log(`   Created: ${existingRole.createdAt}`);
      console.log('\n💡 To create for a different tenant, provide tenant ID:');
      console.log(`   node create-role.js "${roleName}" <tenant-id>\n`);
      process.exit(0);
    }

    // Create role
    console.log(`📦 Creating role "${roleName}"...`);
    const role = await prisma.role.create({
      data: {
        tenantId: tenant.id,
        name: roleName,
      },
    });

    console.log('\n✅ Role created successfully!\n');
    console.log('='.repeat(50));
    console.log('\n📋 Role Details:');
    console.log(`   ID: ${role.id}`);
    console.log(`   Name: ${role.name}`);
    console.log(`   Tenant: ${tenant.name}`);
    console.log(`   Tenant ID: ${tenant.id}`);
    console.log(`   Created: ${role.createdAt}`);
    console.log('\n🎉 Role is ready to use!\n');
    console.log('💡 Next steps:');
    console.log('   - Assign this role to users');
    console.log('   - Add permissions to this role (if needed)\n');

  } catch (error) {
    console.error('\n❌ Error creating role:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get role name and tenant ID from command line arguments
const roleName = process.argv[2];
const tenantId = process.argv[3] || null;

createRole(roleName, tenantId);



