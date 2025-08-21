require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

console.log('Environment variables check:');
console.log('DB_HOST:', process.env.DB_HOST ? 'Set' : 'NOT SET');
console.log('DB_USERNAME:', process.env.DB_USERNAME ? 'Set' : 'NOT SET'); 
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? 'Set' : 'NOT SET');
console.log('DB_NAME:', process.env.DB_NAME ? 'Set' : 'NOT SET');
console.log('DB_PORT:', process.env.DB_PORT || 'Default (3306)');
console.log('DB_SSL:', process.env.DB_SSL || 'false');

async function testConnection() {
  console.log('\nTesting database connection...');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '3306'),
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
      connectTimeout: 10000
    });

    console.log('✅ Connection successful!');
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Query test successful:', rows);
    
    // Test connection to your tables
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('✅ Available tables:', tables.length);
    
    await connection.end();
    console.log('✅ Connection closed successfully');
    
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error errno:', error.errno);
    if (error.sqlState) {
      console.error('SQL State:', error.sqlState);
    }
    if (error.fatal !== undefined) {
      console.error('Fatal:', error.fatal);
    }
    
    // Additional debugging info
    if (error.code === 'ENOTFOUND') {
      console.log('\n🔍 Host resolution issue - check DB_HOST value');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n🔍 Connection refused - check if database server is running and port is correct');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n🔍 Access denied - check username and password');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('\n🔍 Connection timeout - check network connectivity and firewall settings');
    }
  }
}

testConnection().then(() => {
  console.log('\nTest completed.');
  process.exit(0);
}).catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
}); 