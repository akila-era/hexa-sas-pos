const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function setupDatabase() {
  console.log('\n🔧 Database Setup & Migration Tool\n');
  console.log('='.repeat(50) + '\n');

  try {
    // Step 1: Check connection
    console.log('Step 1: Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful!\n');
    
    // Step 2: Check if database exists
    console.log('Step 2: Checking database...');
    const dbCheck = await prisma.$queryRaw`
      SELECT current_database();
    `;
    console.log(`✅ Connected to database: ${dbCheck[0].current_database}\n`);

    // Step 3: Check existing tables
    console.log('Step 3: Checking existing tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log(`📊 Found ${tables.length} existing tables`);
    if (tables.length > 0) {
      console.log('Existing tables:');
      tables.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.table_name}`);
      });
    }
    console.log('');

    // Step 4: Run migrations
    console.log('Step 4: Running database migrations...');
    console.log('This will create all required tables...\n');
    
    try {
      execSync('npx prisma migrate dev --name init', { 
        stdio: 'inherit',
        cwd: __dirname 
      });
      console.log('\n✅ Migrations completed successfully!\n');
    } catch (migrationError) {
      console.log('\n⚠️  Migration error. Trying alternative approach...\n');
      
      // Try to push schema directly
      try {
        execSync('npx prisma db push', { 
          stdio: 'inherit',
          cwd: __dirname 
        });
        console.log('\n✅ Database schema pushed successfully!\n');
      } catch (pushError) {
        console.log('\n❌ Failed to push schema. Please check error above.\n');
        throw pushError;
      }
    }

    // Step 5: Generate Prisma Client
    console.log('Step 5: Generating Prisma Client...');
    execSync('npx prisma generate', { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    console.log('✅ Prisma Client generated!\n');

    // Step 6: Verify tables
    console.log('Step 6: Verifying tables...');
    const newTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    const requiredTables = ['User', 'Tenant', 'Branch', 'Role', 'Permission', 'RolePermission'];
    console.log(`📊 Total tables: ${newTables.length}\n`);
    
    let allTablesExist = true;
    for (const tableName of requiredTables) {
      const exists = newTables.some(t => t.table_name === tableName);
      if (exists) {
        console.log(`✅ ${tableName} table exists`);
      } else {
        console.log(`❌ ${tableName} table NOT found`);
        allTablesExist = false;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    if (allTablesExist) {
      console.log('\n✅ Database setup completed successfully!');
      console.log('✅ All required tables are created.');
      console.log('\nYou can now test the register-super-admin endpoint:');
      console.log('POST http://localhost:5557/api/v1/auth/register-super-admin\n');
    } else {
      console.log('\n⚠️  Some tables are missing. Please check the migration output above.\n');
    }
    
  } catch (error) {
    console.error('\n❌ Database setup failed!\n');
    console.error('Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check if PostgreSQL is running');
    console.error('2. Verify DATABASE_URL in .env file');
    console.error('3. Ensure database "hexa_pos" exists');
    console.error('4. Check PostgreSQL credentials\n');
    
    // Show current DATABASE_URL (without password)
    try {
      const envPath = path.join(__dirname, '.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const dbUrlMatch = envContent.match(/DATABASE_URL=(.+)/);
        if (dbUrlMatch) {
          const dbUrl = dbUrlMatch[1];
          // Hide password in output
          const safeUrl = dbUrl.replace(/:([^:@]+)@/, ':***@');
          console.log('Current DATABASE_URL:', safeUrl);
        }
      }
    } catch (e) {
      // Ignore
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();

