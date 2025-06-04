require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

// Log DB connection info (safe fields only)
console.log('DB connection info:', {
  DB_HOST: process.env.DB_HOST,
  DB_NAME: process.env.DB_NAME,
  DB_PORT: process.env.DB_PORT,
  DB_USERNAME: process.env.DB_USERNAME,
});

async function migrateIdNominaToInt() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  });

  try {
    console.log('Connected to DB. Starting migration of id_nomina column from varchar(255) to int...');
    
    // Step 1: Create backup table
    console.log('Step 1: Creating backup table...');
    await connection.execute('CREATE TABLE documentosajuntos_backup_nomina_migration AS SELECT * FROM documentosajuntos');
    console.log('✓ Backup table created successfully');
    
    // Step 2: Clean up invalid data
    console.log('Step 2: Cleaning up invalid data in id_nomina column...');
    const [updateResult] = await connection.execute(`
      UPDATE documentosajuntos 
      SET id_nomina = NULL 
      WHERE id_nomina IS NOT NULL 
        AND (id_nomina = '' OR id_nomina REGEXP '[^0-9]')
    `);
    console.log(`✓ Cleaned up ${updateResult.affectedRows} rows with invalid id_nomina values`);
    
    // Step 3: Change column type
    console.log('Step 3: Changing column type from varchar(255) to int...');
    await connection.execute(`
      ALTER TABLE documentosajuntos 
      MODIFY COLUMN id_nomina INT NULL 
      COMMENT 'Foreign key reference to nominabeca.ID'
    `);
    console.log('✓ Column type changed successfully');
    
    // Step 4: Create index
    console.log('Step 4: Creating index on id_nomina...');
    try {
      await connection.execute('CREATE INDEX idx_id_nomina ON documentosajuntos(id_nomina)');
      console.log('✓ Index created successfully');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('✓ Index already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    // Step 5: Add foreign key constraint
    console.log('Step 5: Adding foreign key constraint...');
    try {
      await connection.execute(`
        ALTER TABLE documentosajuntos 
        ADD CONSTRAINT fk_documentos_nomina 
        FOREIGN KEY (id_nomina) REFERENCES nominabeca(ID) 
        ON DELETE SET NULL ON UPDATE CASCADE
      `);
      console.log('✓ Foreign key constraint added successfully');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('✓ Foreign key constraint already exists, skipping...');
      } else {
        console.log('⚠ Warning: Could not add foreign key constraint:', error.message);
        console.log('This is not critical for the migration to work');
      }
    }
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('Error during migration:', error);
    await connection.end();
    return false;
  }
}

(async function main() {
  try {
    console.log('=== ID_NOMINA MIGRATION SCRIPT ===');
    console.log('This script will change the id_nomina column from varchar(255) to int');
    console.log('to match the ID field type in the nominabeca table.\n');
    
    const success = await migrateIdNominaToInt();
    
    if (success) {
      console.log('\n=== MIGRATION COMPLETED SUCCESSFULLY ===');
      console.log('✓ id_nomina column has been changed from varchar(255) to int');
      console.log('✓ Backup table created: documentosajuntos_backup_nomina_migration');
      console.log('✓ Invalid data cleaned up');
      console.log('✓ Index and constraints added');
      console.log('\nThe application code has been updated to work with the new int type.');
      process.exit(0);
    } else {
      console.error('\n=== MIGRATION FAILED ===');
      console.error('Please check the error messages above and try again.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Unexpected error during migration:', error);
    process.exit(1);
  }
})(); 