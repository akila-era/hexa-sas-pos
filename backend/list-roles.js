/**
 * List all roles for a tenant or all tenants
 * Usage: 
 *   node list-roles.js  (lists all roles)
 *   node list-roles.js <tenant-id>  (lists roles for specific tenant)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listRoles(tenantId = null) {
  try {
    console.log('\n📋 Listing Roles\n');
    console.log('='.repeat(50) + '\n');

    let roles;
    let tenant = null;

    if (tenantId) {
      tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
          roles: {
            include: {
              _count: {
                select: { users: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!tenant) {
        console.error(`❌ Tenant not found with ID: ${tenantId}`);
        process.exit(1);
      }

      roles = tenant.roles;
      console.log(`📋 Roles for Tenant: ${tenant.name} (ID: ${tenant.id})\n`);
    } else {
      const allRoles = await prisma.role.findMany({
        include: {
          _count: {
            select: { users: true },
          },
        },
        orderBy: { name: 'asc' },
      });

      // Get tenant info for each role
      roles = await Promise.all(
        allRoles.map(async (role) => {
          const tenant = await prisma.tenant.findUnique({
            where: { id: role.tenantId },
            select: { id: true, name: true },
          });
          return {
            ...role,
            tenant,
          };
        })
      );

      console.log('📋 All Roles in System\n');
    }

    if (roles.length === 0) {
      console.log('No roles found.\n');
      console.log('💡 Create a role using:');
      console.log('   node create-role.js "Role Name" [tenant-id]\n');
      return;
    }

    // Group by tenant if showing all
    if (!tenantId) {
      const rolesByTenant = {};
      roles.forEach(role => {
        const tenantName = role.tenant?.name || 'Unknown';
        if (!rolesByTenant[tenantName]) {
          rolesByTenant[tenantName] = [];
        }
        rolesByTenant[tenantName].push(role);
      });

      Object.keys(rolesByTenant).forEach(tenantName => {
        console.log(`\n🏢 Tenant: ${tenantName}`);
        console.log('─'.repeat(50));
        rolesByTenant[tenantName].forEach((role, index) => {
          console.log(`\n${index + 1}. ${role.name}`);
          console.log(`   ID: ${role.id}`);
          console.log(`   Users: ${role._count.users}`);
          console.log(`   Created: ${role.createdAt}`);
        });
      });
    } else {
      roles.forEach((role, index) => {
        console.log(`${index + 1}. ${role.name}`);
        console.log(`   ID: ${role.id}`);
        console.log(`   Users: ${role._count.users}`);
        console.log(`   Created: ${role.createdAt}\n`);
      });
    }

    console.log('\n💡 To create a new role:');
    console.log('   node create-role.js "Role Name" [tenant-id]\n');

  } catch (error) {
    console.error('❌ Error listing roles:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const tenantId = process.argv[2] || null;
listRoles(tenantId);

