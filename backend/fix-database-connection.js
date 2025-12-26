const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function testConnection(databaseUrl) {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  });

  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    return { success: true, message: 'Connection successful!' };
  } catch (error) {
    await prisma.$disconnect().catch(() => {});
    return { success: false, message: error.message };
  }
}

async function fixDatabaseConnection() {
  console.log('\n🔧 Database Connection Fixer\n');
  console.log('='.repeat(50) + '\n');

  // Read current .env
  const envPath = path.join(__dirname, '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  } else {
    // Create from example
    const examplePath = path.join(__dirname, 'env.example.txt');
    if (fs.existsSync(examplePath)) {
      envContent = fs.readFileSync(examplePath, 'utf8');
    }
  }

  // Extract current DATABASE_URL
  const dbUrlMatch = envContent.match(/DATABASE_URL=(.+)/);
  const currentUrl = dbUrlMatch ? dbUrlMatch[1] : '';

  console.log('Current DATABASE_URL:', currentUrl.replace(/:([^:@]+)@/, ':***@'));
  console.log('');

  // Test current connection
  if (currentUrl && !currentUrl.includes('username:password')) {
    console.log('Testing current connection...');
    const test = await testConnection(currentUrl);
    if (test.success) {
      console.log('✅ Current connection works!');
      rl.close();
      return;
    } else {
      console.log('❌ Current connection failed:', test.message);
      console.log('');
    }
  }

  // Get new credentials
  console.log('Please provide PostgreSQL credentials:\n');

  const username = await question('PostgreSQL Username (default: postgres): ') || 'postgres';
  const password = await question('PostgreSQL Password: ');
  
  if (!password) {
    console.log('\n❌ Password is required!');
    rl.close();
    process.exit(1);
  }

  const host = await question('PostgreSQL Host (default: localhost): ') || 'localhost';
  const port = await question('PostgreSQL Port (default: 5432): ') || '5432';
  const database = await question('Database Name (default: hexa_pos): ') || 'hexa_pos';

  const databaseUrl = `postgresql://${username}:${password}@${host}:${port}/${database}`;

  console.log('\n🔍 Testing connection...');
  const test = await testConnection(databaseUrl);

  if (!test.success) {
    console.log('\n❌ Connection failed:', test.message);
    console.log('\nPlease check:');
    console.log('1. PostgreSQL is running');
    console.log('2. Username and password are correct');
    console.log('3. Database exists (or create it)');
    console.log('4. PostgreSQL allows connections from localhost\n');
    
    const createDb = await question('Do you want to create the database? (y/n): ');
    if (createDb.toLowerCase() === 'y') {
      // Try to connect to postgres database to create new one
      const postgresUrl = `postgresql://${username}:${password}@${host}:${port}/postgres`;
      const postgresTest = await testConnection(postgresUrl);
      
      if (postgresTest.success) {
        console.log('\n✅ Connected to PostgreSQL server');
        console.log('Creating database...');
        
        const prisma = new PrismaClient({
          datasources: {
            db: {
              url: postgresUrl
            }
          }
        });
        
        try {
          await prisma.$executeRawUnsafe(`CREATE DATABASE "${database}"`);
          console.log(`✅ Database "${database}" created!`);
          await prisma.$disconnect();
          
          // Test connection to new database
          console.log('\n🔍 Testing connection to new database...');
          const newTest = await testConnection(databaseUrl);
          if (newTest.success) {
            console.log('✅ Connection to new database successful!');
          } else {
            console.log('❌ Connection failed:', newTest.message);
            rl.close();
            process.exit(1);
          }
        } catch (error) {
          console.log('❌ Failed to create database:', error.message);
          console.log('You may need to create it manually in pgAdmin');
          rl.close();
          process.exit(1);
        }
      } else {
        console.log('❌ Cannot connect to PostgreSQL to create database');
        console.log('Please create the database manually in pgAdmin');
        rl.close();
        process.exit(1);
      }
    } else {
      rl.close();
      process.exit(1);
    }
  } else {
    console.log('✅ Connection successful!');
  }

  // Update .env file
  console.log('\n📝 Updating .env file...');
  
  if (envContent.includes('DATABASE_URL=')) {
    envContent = envContent.replace(
      /DATABASE_URL=.*/,
      `DATABASE_URL=${databaseUrl}`
    );
  } else {
    envContent += `\nDATABASE_URL=${databaseUrl}\n`;
  }

  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file updated!\n');

  console.log('='.repeat(50));
  console.log('\n✅ Database connection fixed!\n');
  console.log('Next steps:');
  console.log('1. Run: node setup-database.js');
  console.log('2. Or run: npm run db:migrate');
  console.log('3. Then test: node check-tables.js\n');

  rl.close();
}

fixDatabaseConnection().catch((error) => {
  console.error('Error:', error.message);
  rl.close();
  process.exit(1);
});





