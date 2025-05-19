const { executeQuery } = require('../app/api/db-connection');

/**
 * Delete all records from the documentosajuntos table
 * This function will empty the table but preserve its structure
 */
async function deleteAllDocuments() {
  try {
    console.log('Starting deletion of all documents from the database...');
    
    const query = 'DELETE FROM documentosajuntos';
    const result = await executeQuery(query, []);
    
    console.log(`Deletion completed. Affected rows: ${result?.affectedRows || 0}`);
    
    // Check if operation was successful
    return result && result.affectedRows >= 0;
  } catch (error) {
    console.error('Error deleting all documents from database:', error);
    return false;
  }
}

// Execute the function
async function main() {
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
}

// Run the script
main(); 