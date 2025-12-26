/**
 * Test the login query to see what data is returned
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testLoginQuery() {
  try {
    const email = 'superadmin@example.com';
    
    console.log(`\n🔍 Testing login query for: ${email}\n`);
    
    const user = await prisma.user.findFirst({
      where: {
        email: email,
      },
      include: {
        tenant: true,
        branch: true,
        role: true,
      },
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('📋 User Data:');
    console.log(JSON.stringify({
      email: user.email,
      isActive: user.isActive,
      tenantId: user.tenantId,
      tenant: user.tenant ? {
        id: user.tenant.id,
        name: user.tenant.name,
        isActive: user.tenant.isActive,
      } : null,
    }, null, 2));

    console.log('\n🔍 Checking tenant.isActive:');
    console.log(`   user.tenant: ${user.tenant ? 'exists' : 'null'}`);
    console.log(`   user.tenant?.isActive: ${user.tenant?.isActive}`);
    console.log(`   Type: ${typeof user.tenant?.isActive}`);
    
    if (!user.tenant?.isActive) {
      console.log('\n⚠️  Tenant is INACTIVE in query result!');
      console.log('   But it should be active in database...');
      console.log('   This might be a Prisma relation issue.');
    } else {
      console.log('\n✅ Tenant is ACTIVE in query result!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testLoginQuery();



