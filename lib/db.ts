import mysql from 'mysql2/promise';

// Database configuration
const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
  ssl: process.env.DB_SSL === 'true' ? {} : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create a connection pool
const pool = mysql.createPool(config);

// Export a query function that uses the connection pool
export const db = {
  async query<T = any>(queryString: string, params: any[] = []): Promise<T> {
    try {
      const [rows] = await pool.execute(queryString, params);
      return rows as T;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }
}; 