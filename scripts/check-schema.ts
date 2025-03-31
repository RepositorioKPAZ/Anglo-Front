import { executeQuery } from '../app/api/db-connection';

async function checkSchema() {
  try {
    const result = await executeQuery('SHOW COLUMNS FROM nominabeca');
    console.log('Table structure:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

checkSchema(); 