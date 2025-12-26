/**
 * Check tenant status for a specific user
 * Usage: node check-tenant-status.js <email>
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTenantStatus(email) {
  try {
    console.log(`\n🔍 Checking tenant status for: ${email}\n`);
    
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        tenant: true,
        role: true,
        branch: true,
      },
    });

    if (!user) {
      console.error(`❌ User not found with email: ${email}`);
      console.log('\n💡 Available users:');
      const allUsers = await prisma.user.findMany({
        select: { email: true, isActive: true },
        include: { tenant: { select: { name: true, isActive: true } } },
      });
      allUsers.forEach(u => {
        console.log(`   - ${u.email} (User: ${u.isActive ? 'Active' : 'Inactive'}, Tenant: ${u.tenant?.name} (${u.tenant?.isActive ? 'Active' : 'Inactive'}))`);
      });
      process.exit(1);
    }

    console.log('📋 User Details:');
    console.log(`   Email: ${user.email}`);
    console.log(`   User Active: ${user.isActive ? '✅ Yes' : '❌ No'}`);
    console.log(`   Tenant ID: ${user.tenantId}`);
    console.log(`   Tenant Name: ${user.tenant?.name || 'N/A'}`);
    console.log(`   Tenant Active: ${user.tenant?.isActive ? '✅ Yes' : '❌ No'}`);
    console.log(`   Role: ${user.role?.name || 'N/A'}`);
    console.log(`   Branch: ${user.branch?.name || 'N/A'}`);
    
    if (!user.isActive) {
      console.log('\n⚠️  User account is INACTIVE!');
      console.log('   Activating user...');
      await prisma.user.update({
        where: { id: user.id },
        data: { isActive: true },
      });
      console.log('   ✅ User activated!');
    }
    
    if (!user.tenant?.isActive) {
      console.log('\n⚠️  Tenant account is INACTIVE!');
      console.log('   Activating tenant...');
      await prisma.tenant.update({
        where: { id: user.tenantId },
        data: { isActive: true },
      });
      console.log('   ✅ Tenant activated!');
    }
    
    if (user.isActive && user.tenant?.isActive) {
      console.log('\n✅ Everything is active! User should be able to login.');
    }

  } catch (error) {
    console.error('❌ Error checking tenant status:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2] || 'superadmin@example.com';
checkTenantStatus(email);



