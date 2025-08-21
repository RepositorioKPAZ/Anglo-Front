require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

console.log('🔍 Azure Database for MySQL Connection Test');
console.log('');

// Test 1: Connection with SSL required (Azure default)
console.log('1. Testing connection with SSL required...');

async function testAzureConnection() {
  const configs = [
    {
      name: 'SSL Required (Azure Default)',
      config: {
        host: process.env.DB_HOST,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT || '3306'),
        ssl: {
          rejectUnauthorized: false // For Azure, this is often needed
        },
        connectTimeout: 30000,
        acquireTimeout: 30000,
        timeout: 30000
      }
    },
    {
      name: 'SSL with CA verification',
      config: {
        host: process.env.DB_HOST,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT || '3306'),
        ssl: {
          rejectUnauthorized: true
        },
        connectTimeout: 30000,
        acquireTimeout: 30000,
        timeout: 30000
      }
    },
    {
      name: 'No SSL (might fail on Azure)',
      config: {
        host: process.env.DB_HOST,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT || '3306'),
        ssl: false,
        connectTimeout: 30000,
        acquireTimeout: 30000,
        timeout: 30000
      }
    }
  ];

  for (const testConfig of configs) {
    console.log(`\n--- Testing: ${testConfig.name} ---`);
    
    try {
      const connection = await mysql.createConnection(testConfig.config);
      console.log('✅ Connection successful!');
      
      // Test a simple query
      const [rows] = await connection.execute('SELECT 1 as test');
      console.log('✅ Query test successful:', rows[0]);
      
      await connection.end();
      console.log('✅ Connection closed successfully');
      
      return true; // Success, no need to try other configs
      
    } catch (error) {
      console.log('❌ Connection failed:', error.message);
      console.log('   Error code:', error.code);
      
      if (error.code === 'ETIMEDOUT') {
        console.log('   💡 This suggests a firewall issue');
      } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        console.log('   💡 Username/password issue');
      } else if (error.code === 'ECONNREFUSED') {
        console.log('   💡 Connection refused - server might be down');
      }
    }
  }
  
  return false; // All configs failed
}

// Test 2: Check current IP
console.log('\n2. Getting your current public IP...');

async function getCurrentIP() {
  const https = require('https');
  
  return new Promise((resolve, reject) => {
    https.get('https://api.ipify.org', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function runTests() {
  try {
    const currentIP = await getCurrentIP();
    console.log('Your current public IP:', currentIP);
    console.log('');
    
    console.log('🔧 Azure Database Firewall Check:');
    console.log('   1. Go to Azure Portal');
    console.log('   2. Navigate to your MySQL server: kpazserv0001.mysql.database.azure.com');
    console.log('   3. Go to "Connection security" or "Networking"');
    console.log('   4. Add your IP address:', currentIP);
    console.log('   5. Make sure "Allow access to Azure services" is enabled');
    console.log('');
    
  } catch (error) {
    console.log('Could not determine current IP:', error.message);
  }
  
  const success = await testAzureConnection();
  
  if (!success) {
    console.log('\n❌ All connection attempts failed');
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check Azure firewall rules (add your IP)');
    console.log('2. Verify SSL is enabled on Azure Database');
    console.log('3. Check if the server is running');
    console.log('4. Verify your credentials are correct');
    console.log('5. Check if your network allows outbound connections on port 3306');
  }
}

runTests().catch(console.error); 