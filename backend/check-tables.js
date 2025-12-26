const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTables() {
  try {
    console.log('\n📊 Checking Database Tables\n');
    console.log('='.repeat(50) + '\n');
    
    // Connect to database
    await prisma.$connect();
    console.log('✅ Connected to database\n');
    
    // Get database name
    const dbInfo = await prisma.$queryRaw`
      SELECT current_database() as db_name;
    `;
    console.log(`Database: ${dbInfo[0].db_name}\n`);
    
    // Get all tables
    const tables = await prisma.$queryRaw`
      SELECT 
        table_name,
        table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    if (tables.length === 0) {
      console.log('❌ No tables found in the database!\n');
      console.log('Tables need to be created. Run:');
      console.log('  npm run db:migrate');
      console.log('  OR');
      console.log('  node setup-database.js\n');
    } else {
      console.log(`✅ Found ${tables.length} tables:\n`);
      console.log('Table Name'.padEnd(30) + 'Type');
      console.log('-'.repeat(50));
      tables.forEach((table) => {
        console.log(table.table_name.padEnd(30) + table.table_type);
      });
      console.log('');
      
      // Check for required tables
      const requiredTables = ['User', 'Tenant', 'Branch', 'Role', 'Permission', 'RolePermission'];
      console.log('\nRequired Tables Check:');
      console.log('-'.repeat(50));
      
      let allExist = true;
      for (const reqTable of requiredTables) {
        const exists = tables.some(t => t.table_name === reqTable);
        if (exists) {
          console.log(`✅ ${reqTable.padEnd(25)} - EXISTS`);
        } else {
          console.log(`❌ ${reqTable.padEnd(25)} - MISSING`);
          allExist = false;
        }
      }
      
      if (!allExist) {
        console.log('\n⚠️  Some required tables are missing!');
        console.log('Run migrations to create them:\n');
        console.log('  npm run db:migrate\n');
      } else {
        console.log('\n✅ All required tables exist!\n');
      }
    }
    
    // Show table counts
    if (tables.length > 0) {
      console.log('\nTable Record Counts:');
      console.log('-'.repeat(50));
      
      for (const table of tables) {
        try {
          const count = await prisma.$queryRawUnsafe(
            `SELECT COUNT(*) as count FROM "${table.table_name}"`
          );
          console.log(`${table.table_name.padEnd(30)} ${count[0].count} records`);
        } catch (e) {
          // Skip if can't count
        }
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('\n❌ Error checking tables!\n');
    console.error('Error:', error.message);
    console.error('\nPossible issues:');
    console.error('1. Database connection failed');
    console.error('2. Database does not exist');
    console.error('3. Wrong credentials in .env file\n');
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();





