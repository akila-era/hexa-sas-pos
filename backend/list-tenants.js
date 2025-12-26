/**
 * Script to list all tenants
 * Usage: node list-tenants.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listTenants() {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        users: {
          select: {
            email: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (tenants.length === 0) {
      console.log('No tenants found.');
      return;
    }

    console.log(`\n📋 Found ${tenants.length} tenant(s):\n`);
    
    tenants.forEach((tenant, index) => {
      console.log(`${index + 1}. ${tenant.name}`);
      console.log(`   ID: ${tenant.id}`);
      console.log(`   Email: ${tenant.email || 'N/A'}`);
      console.log(`   Status: ${tenant.isActive ? '✅ Active' : '❌ Inactive'}`);
      console.log(`   Plan: ${tenant.plan}`);
      console.log(`   Users: ${tenant._count.users}`);
      
      if (tenant.users && tenant.users.length > 0) {
        console.log(`   User emails:`);
        tenant.users.forEach(user => {
          console.log(`      - ${user.email} (${user.isActive ? 'Active' : 'Inactive'})`);
        });
      }
      console.log('');
    });

    console.log('\n💡 To activate a tenant, use:');
    console.log('   node activate-tenant.js <user-email>');
    console.log('   OR');
    console.log('   node activate-tenant.js <tenant-id>\n');

  } catch (error) {
    console.error('❌ Error listing tenants:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

listTenants();



