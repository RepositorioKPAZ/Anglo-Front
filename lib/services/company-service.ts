import { User } from "@/lib/utils/excel-reader";
import { readUsersFromExcel } from "@/lib/utils/excel-reader";
import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";
import { generatePassword } from "@/lib/utils/password-utils";

// This interface will help us swap implementations later
export interface CompanyService {
  getAllCompanies(): Promise<User[]>;
  createCompany(company: Omit<User, "ID" | "Empresa_C">): Promise<User>;
  updateCompany(company: User): Promise<User>;
  deleteCompany(rut: string): Promise<boolean>;
}

// Excel implementation
export class ExcelCompanyService implements CompanyService {
  private getFilePath(): string {
    return path.join(process.cwd(), "lib", "data", "ListaEmpresa.xlsx");
  }

  private async writeToExcel(companies: User[]): Promise<void> {
    const filePath = this.getFilePath();
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(companies);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    fs.writeFileSync(filePath, excelBuffer);
  }

  async getAllCompanies(): Promise<User[]> {
    return readUsersFromExcel();
  }

  async createCompany(company: Omit<User, "ID" | "Empresa_C">): Promise<User> {
    const companies = await this.getAllCompanies();
    
    // Generate new ID
    const maxId = Math.max(...companies.map(c => c.ID), 0);
    const newId = maxId + 1;

    // Create new company with generated password
    const newCompany: User = {
      ...company,
      ID: newId,
      Empresa_C: generatePassword({ Rut: company.Rut, ID: newId.toString() })
    };

    // Add to companies array
    companies.push(newCompany);

    // Write back to Excel
    await this.writeToExcel(companies);

    return newCompany;
  }

  async updateCompany(company: User): Promise<User> {
    const companies = await this.getAllCompanies();
    const index = companies.findIndex(c => c.Rut === company.Rut);
    
    if (index === -1) {
      throw new Error("Company not found");
    }

    companies[index] = company;
    await this.writeToExcel(companies);
    
    return company;
  }

  async deleteCompany(rut: string): Promise<boolean> {
    const companies = await this.getAllCompanies();
    const index = companies.findIndex(c => c.Rut === rut);
    
    if (index === -1) {
      return false;
    }

    companies.splice(index, 1);
    await this.writeToExcel(companies);
    
    return true;
  }
}

// Export a singleton instance
export const companyService = new ExcelCompanyService(); 