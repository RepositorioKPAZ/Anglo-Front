import { executeQuery, pool } from '../app/api/db-connection';

// Export a query function that maintains the same interface as before
// but uses the executeQuery function from db-connection.ts underneath
export const db = {
  async query<T = any>(queryString: string, params: any[] = []): Promise<T> {
    try {
      return await executeQuery<T>(queryString, params);
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }
}; 