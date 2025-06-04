require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

console.log('=== REMOVING INDEX AND FK CONSTRAINT ===\n');

async function removeIndexAndConstraint() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  });

  try {
    console.log('Connected to DB. Removing index and foreign key constraint...');
    
    // Remove foreign key constraint
    console.log('Step 1: Removing foreign key constraint...');
    try {
      await connection.execute('ALTER TABLE documentosajuntos DROP FOREIGN KEY fk_documentos_nomina');
      console.log('✓ Foreign key constraint removed');
    } catch (error) {
      if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('✓ Foreign key constraint does not exist, skipping...');
      } else {
        throw error;
      }
    }
    
    // Remove index
    console.log('Step 2: Removing index...');
    try {
      await connection.execute('DROP INDEX idx_id_nomina ON documentosajuntos');
      console.log('✓ Index removed');
    } catch (error) {
      if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('✓ Index does not exist, skipping...');
      } else {
        throw error;
      }
    }
    
    // Verify column is still int
    console.log('Step 3: Verifying column type...');
    const [columns] = await connection.execute(`
      SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'documentosajuntos' AND COLUMN_NAME = 'id_nomina'
    `, [process.env.DB_NAME]);
    
    if (columns.length > 0 && columns[0].DATA_TYPE === 'int') {
      console.log('✓ Column is still int type');
    } else {
      throw new Error('Column type verification failed');
    }
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('Error during cleanup:', error);
    await connection.end();
    return false;
  }
}

(async function main() {
  try {
    const success = await removeIndexAndConstraint();
    
    if (success) {
      console.log('\n=== CLEANUP COMPLETED SUCCESSFULLY ===');
      console.log('✓ Index removed');
      console.log('✓ Foreign key constraint removed');
      console.log('✓ Column remains as int type');
      console.log('\nThe column type change and code updates are preserved.');
      process.exit(0);
    } else {
      console.error('\n=== CLEANUP FAILED ===');
      process.exit(1);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
})(); 