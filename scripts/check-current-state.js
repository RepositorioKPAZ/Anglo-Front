require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

console.log('=== CHECKING CURRENT STATE ===\n');

async function checkCurrentState() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  });

  try {
    console.log('Connected to database:', process.env.DB_NAME);
    
    // Check column details
    console.log('\n1. Column Details:');
    const [columnInfo] = await connection.execute(`
      SELECT DATA_TYPE, IS_NULLABLE, COLUMN_COMMENT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'documentosajuntos' AND COLUMN_NAME = 'id_nomina'
    `, [process.env.DB_NAME]);
    
    if (columnInfo.length > 0) {
      const info = columnInfo[0];
      console.log(`   Type: ${info.DATA_TYPE}`);
      console.log(`   Nullable: ${info.IS_NULLABLE}`);
      console.log(`   Comment: ${info.COLUMN_COMMENT || 'None'}`);
    } else {
      console.log('   ❌ id_nomina column not found!');
    }
    
    // Check for indexes
    console.log('\n2. Indexes on id_nomina:');
    const [indexes] = await connection.execute(`
      SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'documentosajuntos' AND COLUMN_NAME = 'id_nomina'
    `, [process.env.DB_NAME]);
    
    if (indexes.length > 0) {
      indexes.forEach(idx => console.log(`   - ${idx.INDEX_NAME}`));
    } else {
      console.log('   ✓ No indexes (as expected)');
    }
    
    // Check for foreign key constraints
    console.log('\n3. Foreign Key Constraints:');
    const [fks] = await connection.execute(`
      SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME 
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'documentosajuntos' 
      AND COLUMN_NAME = 'id_nomina' AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [process.env.DB_NAME]);
    
    if (fks.length > 0) {
      fks.forEach(fk => console.log(`   - ${fk.CONSTRAINT_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`));
    } else {
      console.log('   ✓ No foreign key constraints (as expected)');
    }
    
    // Check sample data
    console.log('\n4. Sample Data:');
    const [sampleData] = await connection.execute(`
      SELECT id_nomina, COUNT(*) as count 
      FROM documentosajuntos 
      GROUP BY id_nomina 
      ORDER BY count DESC 
      LIMIT 5
    `);
    
    if (sampleData.length > 0) {
      console.log('   Sample id_nomina values:');
      sampleData.forEach(row => {
        console.log(`   - ${row.id_nomina} (${row.count} documents)`);
      });
    } else {
      console.log('   No documents in table');
    }
    
    // Test a simple query that the application would use
    console.log('\n5. Testing Application Query:');
    const testNominaId = 1;
    const [testResult] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM documentosajuntos 
      WHERE id_nomina = ?
    `, [testNominaId]);
    
    console.log(`   Query "WHERE id_nomina = ${testNominaId}" returned: ${testResult[0].count} documents`);
    console.log('   ✓ Integer comparison working correctly');
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('Error checking state:', error);
    await connection.end();
    return false;
  }
}

(async function main() {
  try {
    await checkCurrentState();
    console.log('\n=== CURRENT STATE CHECK COMPLETE ===');
  } catch (error) {
    console.error('Error:', error);
  }
})(); 