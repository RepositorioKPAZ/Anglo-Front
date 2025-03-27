import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";
import { NominaRow } from "@/lib/utils/excel-reader";

export async function GET() {
  try {
    // Get the path to the Excel file
    const filePath = path.join(process.cwd(), "lib", "data", "ListaNominas.xlsx");
    
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "El archivo de nóminas no existe" },
        { status: 404 }
      );
    }

    // Read the file
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    
    // Get the first sheet
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as NominaRow[];
    
    return NextResponse.json(jsonData);
  } catch (error) {
    console.error("Error reading Excel file:", error);
    return NextResponse.json(
      { error: "Error al leer el archivo de nóminas" },
      { status: 500 }
    );
  }
} 