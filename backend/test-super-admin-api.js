/**
 * Test Super Admin Registration API
 * Usage: node test-super-admin-api.js
 */

const http = require('http');

const data = JSON.stringify({
  email: 'testadmin@example.com',
  password: 'TestAdmin123',
  firstName: 'Test',
  lastName: 'Admin',
});

const options = {
  hostname: 'localhost',
  port: 5557,
  path: '/api/v1/auth/register-super-admin',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
  },
};

console.log('\n🔧 Testing Super Admin Registration API\n');
console.log('Request:', JSON.stringify(JSON.parse(data), null, 2));
console.log('\nSending request...\n');

const req = http.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', JSON.stringify(JSON.parse(responseData), null, 2));
    
    if (res.statusCode === 201) {
      console.log('\n✅ Super Admin created successfully!');
    } else {
      console.log('\n❌ Failed to create Super Admin');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
  console.log('\n💡 Make sure the backend server is running on port 5557');
});

req.write(data);
req.end();



