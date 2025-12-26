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

async function updateDatabaseUrl() {
  console.log('\n🔧 Database URL Configuration\n');
  console.log('='.repeat(50) + '\n');
  console.log('Please provide your PostgreSQL credentials:\n');

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

  console.log('\n📝 Updating .env file...');
  
  const envPath = path.join(__dirname, '.env');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  } else {
    // Create from example if .env doesn't exist
    const examplePath = path.join(__dirname, 'env.example.txt');
    if (fs.existsSync(examplePath)) {
      envContent = fs.readFileSync(examplePath, 'utf8');
    }
  }

  // Update or add DATABASE_URL
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
  console.log('DATABASE_URL has been set.');
  console.log('\nNext steps:');
  console.log('1. Run: node setup-database.js');
  console.log('2. Or run: npm run db:migrate\n');

  rl.close();
}

updateDatabaseUrl().catch(console.error);





