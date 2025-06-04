require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

console.log('=== SIMPLE ID_NOMINA MIGRATION ===\n');
console.log('This script changes id_nomina from varchar(255) to int');
console.log('No indexes or foreign key constraints are added.\n');

async function migrateIdNominaSimple() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  });

  try {
    console.log('Connected to database:', process.env.DB_NAME);
    
    // Step 1: Create backup
    console.log('\nStep 1: Creating backup table...');
    await connection.execute('CREATE TABLE documentosajuntos_backup_simple AS SELECT * FROM documentosajuntos');
    console.log('✓ Backup table created: documentosajuntos_backup_simple');
    
    // Step 2: Check current data
    console.log('\nStep 2: Checking existing data...');
    const [currentData] = await connection.execute(`
      SELECT id_nomina, COUNT(*) as count 
      FROM documentosajuntos 
      WHERE id_nomina IS NOT NULL AND id_nomina REGEXP '[^0-9]'
      GROUP BY id_nomina
    `);
    
    if (currentData.length > 0) {
      console.log('⚠️  Found non-numeric id_nomina values:');
      currentData.forEach(row => {
        console.log(`   "${row.id_nomina}" (${row.count} rows)`);
      });
    } else {
      console.log('✓ All id_nomina values are numeric or NULL');
    }
    
    // Step 3: Clean invalid data
    console.log('\nStep 3: Cleaning invalid data...');
    const [updateResult] = await connection.execute(`
      UPDATE documentosajuntos 
      SET id_nomina = NULL 
      WHERE id_nomina IS NOT NULL 
        AND (id_nomina = '' OR id_nomina REGEXP '[^0-9]')
    `);
    console.log(`✓ Cleaned ${updateResult.affectedRows} rows with invalid id_nomina values`);
    
    // Step 4: Change column type
    console.log('\nStep 4: Changing column type to int...');
    await connection.execute(`
      ALTER TABLE documentosajuntos 
      MODIFY COLUMN id_nomina INT NULL 
      COMMENT 'Reference to nominabeca.ID'
    `);
    console.log('✓ Column type changed from varchar(255) to int');
    
    // Step 5: Verify the change
    console.log('\nStep 5: Verifying migration...');
    const [columnInfo] = await connection.execute(`
      SELECT DATA_TYPE, IS_NULLABLE, COLUMN_COMMENT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'documentosajuntos' AND COLUMN_NAME = 'id_nomina'
    `, [process.env.DB_NAME]);
    
    if (columnInfo.length > 0) {
      const info = columnInfo[0];
      console.log('✓ Migration verified:');
      console.log(`   Type: ${info.DATA_TYPE}`);
      console.log(`   Nullable: ${info.IS_NULLABLE}`);
      console.log(`   Comment: ${info.COLUMN_COMMENT}`);
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
    const success = await migrateIdNominaSimple();
    
    if (success) {
      console.log('\n=== MIGRATION COMPLETED SUCCESSFULLY ===');
      console.log('✓ id_nomina column changed from varchar(255) to int');
      console.log('✓ Backup table created for safety');
      console.log('✓ Invalid data cleaned up');
      console.log('\nYour application code is ready to work with the new int type!');
      process.exit(0);
    } else {
      console.error('\n=== MIGRATION FAILED ===');
      console.error('Check the error messages above. The backup table can be used to restore data if needed.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error during migration:', error);
    process.exit(1);
  }
})(); 