const mysql = require('mysql2/promise');

// Database configuration from environment variables
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: true
  },
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_MAX || '10'),
  queueLimit: 0,
  connectTimeout: 30000, // 30 seconds
  acquireTimeout: 30000  // 30 seconds
};

// Log connection details (without sensitive info)
console.log('Attempting to connect with config:', {
  host: dbConfig.host,
  user: dbConfig.user,
  port: dbConfig.port,
  database: dbConfig.database,
  ssl: !!dbConfig.ssl
});

// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Function to get a connection from the pool
async function getConnection() {
  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    console.error('Error getting database connection:', error);
    throw new Error('Failed to connect to database');
  }
}

// Function to execute a query with parameters
async function executeQuery<T>(query: string, params: any[] = []): Promise<T> {
  let connection = null;
  try {
    connection = await getConnection();
    const [results] = await connection.execute(query, params);
    return results as T;
  } catch (error) {
    console.error('Error executing query:', error);
    throw new Error('Failed to execute query');
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Function to execute a transaction
async function executeTransaction<T>(
  callback: (connection: any) => Promise<T>
): Promise<T> {
  let connection = null;
  try {
    connection = await getConnection();
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error executing transaction:', error);
    throw new Error('Failed to execute transaction');
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Function to test the database connection
async function testConnection(): Promise<boolean> {
  try {
    const connection = await getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    console.error('Error testing database connection:', error);
    return false;
  }
}

// Test the connection immediately
console.log('Testing database connection...');
testConnection()
  .then((success) => {
    if (success) {
      console.log('✅ Database connection successful!');
    } else {
      console.error('❌ Database connection failed!');
    }
  })
  .catch((error) => {
    console.error('❌ Database connection error:', error);
  });

// Export the functions and pool
module.exports = {
  getConnection,
  executeQuery,
  executeTransaction,
  testConnection,
  pool
};
