const path = require('path');
const db = require(path.join(__dirname, '../.next/server/app/api/db-connection.js'));

async function deleteAllDocuments() {
  try {
    console.log('Starting deletion of all documents from the database...');
    const query = 'DELETE FROM documentosajuntos';
    const result = await db.executeQuery(query, []);
    console.log(`Deletion completed. Affected rows: ${result?.affectedRows || 0}`);
    return result && result.affectedRows >= 0;
  } catch (error) {
    console.error('Error deleting all documents from database:', error);
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