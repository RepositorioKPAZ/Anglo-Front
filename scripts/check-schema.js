require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function checkSchema() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '3306'),
      ssl: process.env.DB_SSL === 'true' ? {} : undefined
    });

    const [rows] = await connection.execute('SHOW COLUMNS FROM nominabeca');
    console.log('Table structure:', JSON.stringify(rows, null, 2));
    
    await connection.end();
  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

checkSchema(); 