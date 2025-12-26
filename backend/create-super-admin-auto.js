/**
 * Auto-create super admin without prompts
 * Usage: node create-super-admin-auto.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    console.log('\n🔧 Creating Super Admin (Auto Mode)\n');
    console.log('='.repeat(50) + '\n');

    const email = 'superadmin@example.com';
    const password = 'Admin123456';
    const firstName = 'Super';
    const lastName = 'Admin';

    console.log(`Email: ${email}`);
    console.log(`Password: ${password}\n`);

    // Check if super admin already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true, role: true },
    });

    if (existingUser) {
      console.log('✅ Super admin already exists!');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Tenant: ${existingUser.tenant?.name || 'N/A'}`);
      console.log(`   Tenant Active: ${existingUser.tenant?.isActive ? 'Yes' : 'No'}`);
      
      if (!existingUser.tenant?.isActive) {
        console.log('\n🔧 Activating tenant...');
        await prisma.tenant.update({
          where: { id: existingUser.tenantId },
          data: { isActive: true },
        });
        console.log('✅ Tenant activated!');
      }
      
      process.exit(0);
    }

    // Find or create System tenant
    let systemTenant = await prisma.tenant.findFirst({
      where: { name: 'System' },
    });

    if (!systemTenant) {
      console.log('📦 Creating System tenant...');
      systemTenant = await prisma.tenant.create({
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
      // Ensure it's active
      if (!systemTenant.isActive) {
        await prisma.tenant.update({
          where: { id: systemTenant.id },
          data: { isActive: true },
        });
        console.log('✅ System tenant activated!');
      }
    }

    // Find or create System branch
    let systemBranch = await prisma.branch.findFirst({
      where: {
        tenantId: systemTenant.id,
        name: 'System Branch',
      },
    });

    if (!systemBranch) {
      console.log('📦 Creating System Branch...');
      systemBranch = await prisma.branch.create({
        data: {
          tenantId: systemTenant.id,
          name: 'System Branch',
          isActive: true,
        },
      });
      console.log('✅ System Branch created!');
    } else {
      console.log('✅ System Branch found');
    }

    // Find or create Super Admin role
    let superAdminRole = await prisma.role.findFirst({
      where: {
        tenantId: systemTenant.id,
        name: 'Super Admin',
      },
    });

    if (!superAdminRole) {
      console.log('📦 Creating Super Admin role...');
      superAdminRole = await prisma.role.create({
        data: {
          tenantId: systemTenant.id,
          name: 'Super Admin',
        },
      });
      console.log('✅ Super Admin role created!');
    } else {
      console.log('✅ Super Admin role found');
    }

    // Create super admin user
    console.log('📦 Creating super admin user...');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const superAdmin = await prisma.user.create({
      data: {
        tenantId: systemTenant.id,
        branchId: systemBranch.id,
        roleId: superAdminRole.id,
        email,
        password: hashedPassword,
        isActive: true,
      },
    });

    console.log('\n✅ Super Admin created successfully!\n');
    console.log('='.repeat(50));
    console.log('\n📋 Details:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Name: ${firstName} ${lastName}`);
    console.log(`   Tenant: ${systemTenant.name} (Active: ${systemTenant.isActive})`);
    console.log(`   Role: ${superAdminRole.name}`);
    console.log('\n🎉 You can now login with these credentials!');
    console.log('   URL: http://localhost:3006/login\n');

  } catch (error) {
    console.error('\n❌ Error creating super admin:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();



