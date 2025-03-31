require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Create connection URL with encoded password
    const connectionUrl = `mysql://${process.env.DB_USERNAME}:${encodeURIComponent(process.env.DB_PASSWORD)}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?ssl={"rejectUnauthorized":false}`;
    
    console.log('Attempting connection with URL format...');
    const connection = await mysql.createConnection(connectionUrl);
    
    console.log('Connected successfully!');
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('Query test successful:', rows);
    
    await connection.end();
    console.log('Connection closed.');
  } catch (error) {
    console.error('Connection failed:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState
    });
  }
}

testConnection(); 