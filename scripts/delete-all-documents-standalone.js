require('dotenv').config();
const mysql = require('mysql2/promise');

// Log DB connection info (safe fields only)
console.log('DB connection info:', {
  DB_HOST: process.env.DB_HOST,
  DB_NAME: process.env.DB_NAME,
  DB_PORT: process.env.DB_PORT,
  DB_USER: process.env.DB_USER,
});

async function deleteAllDocuments() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  });

  try {
    console.log('Connected to DB. Deleting all documents...');
    const [result] = await connection.execute('DELETE FROM documentosajuntos');
    console.log(`Deletion completed. Affected rows: ${result.affectedRows}`);
    await connection.end();
    return result.affectedRows >= 0;
  } catch (error) {
    console.error('Error deleting all documents:', error);
    await connection.end();
    return false;
  }
}

(async function main() {
  try {
    const success = await deleteAllDocuments();
    if (success) {
      console.log('Successfully deleted all documents from the documentosajuntos table');
      process.exit(0);
    } else {
      console.error('Failed to delete all documents');
      process.exit(1);
    }
  } catch (error) {
    console.error('Unexpected error during execution:', error);
    process.exit(1);
  }
})(); 