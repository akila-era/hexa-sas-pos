/**
 * Test role name check for super admin
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testRoleCheck() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'superadmin@example.com' },
      include: {
        role: true,
        tenant: true,
      },
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('\n📋 User Details:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Role Name: "${user.role?.name}"`);
    console.log(`   Role Name (lowercase): "${user.role?.name?.toLowerCase()}"`);
    console.log(`   Tenant Active: ${user.tenant?.isActive}`);
    
    // Test the same check as in backend
    const roleName = (user.role?.name?.toLowerCase() || '');
    const isSuperAdmin = roleName.includes('super admin') || roleName.includes('superadmin');
    
    console.log(`\n🔍 Super Admin Check:`);
    console.log(`   roleName.includes('super admin'): ${roleName.includes('super admin')}`);
    console.log(`   roleName.includes('superadmin'): ${roleName.includes('superadmin')}`);
    console.log(`   isSuperAdmin: ${isSuperAdmin}`);
    
    if (isSuperAdmin) {
      console.log('\n✅ User is Super Admin - should bypass tenant check');
    } else {
      console.log('\n❌ User is NOT Super Admin - will check tenant status');
      console.log(`   Current role name: "${user.role?.name}"`);
      console.log(`   Expected: "Super Admin"`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testRoleCheck();



