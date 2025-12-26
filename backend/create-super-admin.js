const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const readline = require('readline');
const prisma = new PrismaClient();

// Get command line arguments or use defaults
const args = process.argv.slice(2);
const emailArg = args.find(arg => arg.startsWith('--email='))?.split('=')[1];
const passwordArg = args.find(arg => arg.startsWith('--password='))?.split('=')[1];
const firstNameArg = args.find(arg => arg.startsWith('--firstName='))?.split('=')[1];
const lastNameArg = args.find(arg => arg.startsWith('--lastName='))?.split('=')[1];

async function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

async function createSuperAdmin() {
  try {
    console.log('\n🔧 Creating Super Admin\n');
    console.log('='.repeat(50) + '\n');

    // Get email
    let email = emailArg;
    if (!email) {
      email = await askQuestion('Enter email address: ');
      if (!email || !email.includes('@')) {
        console.error('❌ Invalid email address!');
        process.exit(1);
      }
    }

    // Get password
    let password = passwordArg;
    if (!password) {
      password = await askQuestion('Enter password (min 8 characters): ');
      if (!password || password.length < 8) {
        console.error('❌ Password must be at least 8 characters!');
        process.exit(1);
      }
    }

    // Get first name
    const firstName = firstNameArg || await askQuestion('Enter first name (optional, press Enter to skip): ') || 'Super';
    
    // Get last name
    const lastName = lastNameArg || await askQuestion('Enter last name (optional, press Enter to skip): ') || 'Admin';

    // Check if user already exists
    console.log('Step 1: Checking if super admin already exists...');
    const existingUser = await prisma.user.findFirst({
      where: { email }
    });

    if (existingUser) {
      console.log('⚠️  Super admin already exists with this email!');
      console.log(`   User ID: ${existingUser.id}`);
      console.log(`   Email: ${existingUser.email}\n`);
      return;
    }
    console.log('✅ Email is available\n');

    // Get or create System Tenant
    console.log('Step 2: Getting/Creating System Tenant...');
    let systemTenant = await prisma.tenant.findFirst({
      where: { name: 'System' }
    });

    if (!systemTenant) {
      systemTenant = await prisma.tenant.create({
        data: {
          name: 'System',
          plan: 'ADMIN',
          isActive: true
        }
      });
      console.log('✅ System Tenant created\n');
    } else {
      console.log('✅ System Tenant exists\n');
    }

    // Get or create System Branch
    console.log('Step 3: Getting/Creating System Branch...');
    let systemBranch = await prisma.branch.findFirst({
      where: {
        tenantId: systemTenant.id,
        name: 'System Branch'
      }
    });

    if (!systemBranch) {
      systemBranch = await prisma.branch.create({
        data: {
          tenantId: systemTenant.id,
          name: 'System Branch',
          isActive: true
        }
      });
      console.log('✅ System Branch created\n');
    } else {
      console.log('✅ System Branch exists\n');
    }

    // Get or create Super Admin Role
    console.log('Step 4: Getting/Creating Super Admin Role...');
    let superAdminRole = await prisma.role.findFirst({
      where: {
        tenantId: systemTenant.id,
        name: 'Super Admin'
      }
    });

    if (!superAdminRole) {
      superAdminRole = await prisma.role.create({
        data: {
          tenantId: systemTenant.id,
          name: 'Super Admin'
        }
      });
      console.log('✅ Super Admin Role created\n');
    } else {
      console.log('✅ Super Admin Role exists\n');
    }

    // Hash password
    console.log('Step 5: Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed\n');

    // Create user
    console.log('Step 6: Creating Super Admin user...');
    const user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        tenantId: systemTenant.id,
        branchId: systemBranch.id,
        roleId: superAdminRole.id,
        isActive: true
      },
      include: {
        tenant: true,
        branch: true,
        role: true
      }
    });

    console.log('✅ Super Admin created successfully!\n');
    console.log('='.repeat(50));
    console.log('\n📋 Super Admin Details:\n');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Tenant: ${user.tenant.name} (${user.tenant.id})`);
    console.log(`   Branch: ${user.branch.name} (${user.branch.id})`);
    console.log(`   Role: ${user.role.name} (${user.role.id})`);
    console.log(`   Active: ${user.isActive}\n`);
    console.log('='.repeat(50));
    console.log('\n✅ Super Admin creation complete!\n');
    console.log('You can now login with:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}\n`);
    console.log('='.repeat(50));
    console.log('\n💡 Usage Examples:\n');
    console.log('Interactive mode:');
    console.log('   npm run create-super-admin\n');
    console.log('With command line arguments:');
    console.log('   npm run create-super-admin -- --email=admin@example.com --password=SecurePass123');
    console.log('   npm run create-super-admin -- --email=admin@example.com --password=SecurePass123 --firstName=John --lastName=Doe\n');

  } catch (error) {
    console.error('\n❌ Error creating super admin:\n');
    console.error('Error:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
