import { NextResponse } from "next/server";
import { readUsersFromExcel, User } from "@/lib/utils/excel-reader";
import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";

export async function GET() {
  try {
    const empresas = readUsersFromExcel();
    return NextResponse.json(empresas);
  } catch (error) {
    console.error("Error fetching empresas:", error);
    return NextResponse.json(
      { error: "Error al cargar los datos de empresas" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const newCompany: User = await request.json();

    // Validate required fields
    if (!newCompany.Rut || !newCompany.Empresa || !newCompany.Operacion || 
        !newCompany.Encargado || !newCompany.Mail || !newCompany.Telefono || 
        !newCompany.Empresa_C) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    // Get all existing companies
    const companies = readUsersFromExcel();
    
    // Check if company with same RUT already exists
    if (companies.some(company => company.Rut === newCompany.Rut)) {
      return NextResponse.json(
        { error: "Ya existe una empresa con este RUT" },
        { status: 400 }
      );
    }

    // Generate new ID (max existing ID + 1)
    const maxId = Math.max(...companies.map(c => c.ID), 0);
    newCompany.ID = maxId + 1;

    // Add new company to the array
    companies.push(newCompany);

    // Get the file path
    const filePath = path.join(process.cwd(), "lib", "data", "ListaEmpresa.xlsx");

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(companies);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    // Write to file
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    fs.writeFileSync(filePath, excelBuffer);

    return NextResponse.json({ 
      success: true, 
      message: "Empresa agregada correctamente",
      company: newCompany 
    });
  } catch (error) {
    console.error("Error adding empresa:", error);
    return NextResponse.json(
      { error: "Error al agregar la empresa" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { rut } = await request.json();

    if (!rut) {
      return NextResponse.json(
        { error: "RUT es requerido" },
        { status: 400 }
      );
    }

    // Get all existing companies
    const companies = readUsersFromExcel();
    
    // Find the company to delete
    const companyIndex = companies.findIndex(company => company.Rut === rut);
    
    if (companyIndex === -1) {
      return NextResponse.json(
        { error: "Empresa no encontrada" },
        { status: 404 }
      );
    }

    // Remove the company from the array
    companies.splice(companyIndex, 1);

    // Get the file path
    const filePath = path.join(process.cwd(), "lib", "data", "ListaEmpresa.xlsx");

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(companies);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    // Write to file
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    fs.writeFileSync(filePath, excelBuffer);

    return NextResponse.json({ 
      success: true, 
      message: "Empresa eliminada correctamente"
    });
  } catch (error) {
    console.error("Error deleting empresa:", error);
    return NextResponse.json(
      { error: "Error al eliminar la empresa" },
      { status: 500 }
    );
  }
} 