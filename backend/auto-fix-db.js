const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
    return { success: true };
  } catch (error) {
    await prisma.$disconnect().catch(() => {});
    return { success: false, error: error.message };
  }
}

async function createDatabase(username, password, host, port, database) {
  const postgresUrl = `postgresql://${username}:${password}@${host}:${port}/postgres`;
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: postgresUrl
      }
    }
  });

  try {
    await prisma.$connect();
    await prisma.$executeRawUnsafe(`CREATE DATABASE "${database}"`);
    await prisma.$disconnect();
    return true;
  } catch (error) {
    await prisma.$disconnect().catch(() => {});
    // Database might already exist
    return error.message.includes('already exists');
  }
}

async function autoFixDatabase() {
  console.log('\n🔧 Auto-Fixing Database Connection\n');
  console.log('='.repeat(50) + '\n');

  const envPath = path.join(__dirname, '.env');
  let envContent = fs.existsSync(envPath) 
    ? fs.readFileSync(envPath, 'utf8')
    : '';

  // Common PostgreSQL credentials to try
  const commonConfigs = [
    { username: 'postgres', password: 'postgres', host: 'localhost', port: '5432' },
    { username: 'postgres', password: 'admin', host: 'localhost', port: '5432' },
    { username: 'postgres', password: 'root', host: 'localhost', port: '5432' },
    { username: 'postgres', password: '', host: 'localhost', port: '5432' },
  ];

  const database = 'hexa_pos';
  let workingConfig = null;

  console.log('Step 1: Testing common PostgreSQL configurations...\n');

  for (const config of commonConfigs) {
    const testUrl = `postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${database}`;
    console.log(`Testing: ${config.username}@${config.host}:${config.port}...`);
    
    const result = await testConnection(testUrl);
    
    if (result.success) {
      console.log('✅ Connection successful!\n');
      workingConfig = { ...config, database };
      break;
    } else {
      // Try to create database
      console.log('  ⚠️  Connection failed, trying to create database...');
      const dbCreated = await createDatabase(
        config.username, 
        config.password, 
        config.host, 
        config.port, 
        database
      );
      
      if (dbCreated) {
        console.log('  ✅ Database created, testing connection...');
        const retryResult = await testConnection(testUrl);
        if (retryResult.success) {
          console.log('✅ Connection successful after creating database!\n');
          workingConfig = { ...config, database };
          break;
        }
      }
      console.log('  ❌ Failed\n');
    }
  }

  if (!workingConfig) {
    console.log('❌ Could not connect with common credentials.\n');
    console.log('Please run: node fix-database-connection.js');
    console.log('And enter your PostgreSQL credentials manually.\n');
    process.exit(1);
  }

  // Update .env file
  console.log('Step 2: Updating .env file...');
  const databaseUrl = `postgresql://${workingConfig.username}:${workingConfig.password}@${workingConfig.host}:${workingConfig.port}/${workingConfig.database}`;
  
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

  // Run migrations
  console.log('Step 3: Creating database tables...\n');
  
  try {
    console.log('Running Prisma migrations...');
    execSync('npx prisma migrate dev --name init', { 
      stdio: 'inherit',
      cwd: __dirname,
      env: { ...process.env, DATABASE_URL: databaseUrl }
    });
    console.log('\n✅ Migrations completed!\n');
  } catch (migrationError) {
    console.log('\n⚠️  Migration failed, trying db push...\n');
    try {
      execSync('npx prisma db push', { 
        stdio: 'inherit',
        cwd: __dirname,
        env: { ...process.env, DATABASE_URL: databaseUrl }
      });
      console.log('\n✅ Database schema pushed!\n');
    } catch (pushError) {
      console.log('\n❌ Failed to create tables. Please check the error above.\n');
      process.exit(1);
    }
  }

  // Generate Prisma Client
  console.log('Step 4: Generating Prisma Client...');
  try {
    execSync('npx prisma generate', { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    console.log('✅ Prisma Client generated!\n');
  } catch (error) {
    console.log('⚠️  Prisma generate failed, but continuing...\n');
  }

  // Verify tables
  console.log('Step 5: Verifying tables...\n');
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log(`✅ Found ${tables.length} tables:\n`);
    tables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.table_name}`);
    });
    console.log('');
    
    await prisma.$disconnect();
  } catch (error) {
    console.log('⚠️  Could not verify tables:', error.message);
  }

  console.log('='.repeat(50));
  console.log('\n✅ Database connection fixed and tables created!\n');
  console.log('You can now:');
  console.log('1. Test the endpoint: POST http://localhost:5557/api/v1/auth/register-super-admin');
  console.log('2. Check tables: node check-tables.js\n');
}

autoFixDatabase().catch((error) => {
  console.error('\n❌ Error:', error.message);
  console.error('\nPlease run: node fix-database-connection.js');
  process.exit(1);
});

