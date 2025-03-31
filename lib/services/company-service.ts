import { User } from "@/lib/types/user";
import { db } from "@/lib/db";
import { generatePassword } from "@/lib/utils/password-utils";

// This interface will help us swap implementations later
export interface CompanyService {
  getAllCompanies(): Promise<User[]>;
  createCompany(company: Omit<User, "ID" | "Empresa_C">): Promise<User>;
  updateCompany(company: User): Promise<User>;
  deleteCompany(rut: string): Promise<boolean>;
}

// Database implementation
export class DatabaseCompanyService implements CompanyService {
  async getAllCompanies(): Promise<User[]> {
    try {
      const result = await db.query<User[]>('SELECT * FROM empresacontacto');
      return result;
    } catch (error) {
      console.error("Failed to fetch companies from database:", error);
      throw error;
    }
  }

  async createCompany(company: Omit<User, "ID" | "Empresa_C">): Promise<User> {
    try {
      // Generate password with a temporary ID
      const password = generatePassword({ Rut: company.Rut, ID: "0" });

      // Insert into database
      await db.query(
        `INSERT INTO empresacontacto (
          Rut, Empresa, Operacion, Encargado, Mail, Telefono, Empresa_C
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          company.Rut,
          company.Empresa,
          company.Operacion,
          company.Encargado,
          company.Mail,
          company.Telefono,
          password
        ]
      );

      // Get the created company
      const result = await db.query<User[]>(
        'SELECT * FROM empresacontacto WHERE Rut = ?',
        [company.Rut]
      );

      if (!result.length) {
        throw new Error("Failed to create company");
      }

      return result[0];
    } catch (error) {
      console.error("Failed to create company in database:", error);
      throw error;
    }
  }

  async updateCompany(company: User): Promise<User> {
    try {
      await db.query(
        `UPDATE empresacontacto SET 
          Empresa = ?,
          Operacion = ?,
          Encargado = ?,
          Mail = ?,
          Telefono = ?
        WHERE Rut = ?`,
        [
          company.Empresa,
          company.Operacion,
          company.Encargado,
          company.Mail,
          company.Telefono,
          company.Rut
        ]
      );

      const result = await db.query<User[]>(
        'SELECT * FROM empresacontacto WHERE Rut = ?',
        [company.Rut]
      );

      if (!result.length) {
        throw new Error("Company not found");
      }

      return result[0];
    } catch (error) {
      console.error("Failed to update company in database:", error);
      throw error;
    }
  }

  async deleteCompany(rut: string): Promise<boolean> {
    try {
      const result = await db.query('DELETE FROM empresacontacto WHERE Rut = ?', [rut]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Failed to delete company from database:", error);
      throw error;
    }
  }
}

// Export the service instance
export const companyService = new DatabaseCompanyService(); 