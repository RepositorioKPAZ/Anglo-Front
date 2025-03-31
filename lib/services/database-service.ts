import { executeQuery } from '../../app/api/db-connection';
import { User, DatabaseUser, DatabaseNomina } from '@/lib/types/user';
import { db } from "@/lib/db";

class DatabaseService {
  // User operations
  async findUserByRut(rut: string): Promise<DatabaseUser | null> {
    try {
      const query = 'SELECT * FROM empresacontacto WHERE Rut = ?';
      const results = await executeQuery<DatabaseUser[]>(query, [rut]);
      return results[0] || null;
    } catch (error) {
      console.error('Error finding user by RUT:', error);
      return null;
    }
  }

  async findUserById(id: number): Promise<DatabaseUser | null> {
    try {
      const query = 'SELECT * FROM empresacontacto WHERE ID = ?';
      const results = await executeQuery<DatabaseUser[]>(query, [id]);
      return results[0] || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  // Nomina operations
  async getAllNominas(): Promise<DatabaseNomina[]> {
    try {
      const query = 'SELECT * FROM nominabeca';
      return await executeQuery<DatabaseNomina[]>(query);
    } catch (error) {
      console.error('Error getting all nominas:', error);
      return [];
    }
  }

  async findNominaByRut(rut: string): Promise<DatabaseNomina | null> {
    try {
      const query = 'SELECT * FROM nominabeca WHERE RUT = ?';
      const results = await executeQuery<DatabaseNomina[]>(query, [rut]);
      return results[0] || null;
    } catch (error) {
      console.error('Error finding nomina by RUT:', error);
      return null;
    }
  }
}

// Export a singleton instance
export const databaseService = new DatabaseService();

export async function findUserByRutInDb(rut: string): Promise<User | null> {
  try {
    const result = await db.query<User[]>(
      'SELECT * FROM empresacontacto WHERE Rut = ?',
      [rut]
    );
    return result[0] || null;
  } catch (error) {
    console.error("Error finding user by RUT:", error);
    return null;
  }
}

export async function findUserByIdInDb(id: number): Promise<User | null> {
  try {
    const result = await db.query<User[]>(
      'SELECT * FROM empresacontacto WHERE ID = ?',
      [id]
    );
    return result[0] || null;
  } catch (error) {
    console.error("Error finding user by ID:", error);
    return null;
  }
} 