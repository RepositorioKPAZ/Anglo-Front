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

export async function POST(request: Request) {
  try {
    const newRows = await request.json() as NominaRow[];
    
    // Get the path to the Excel file
    const filePath = path.join(process.cwd(), "lib", "data", "ListaNominas.xlsx");
    
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "El archivo de nóminas no existe" },
        { status: 404 }
      );
    }

    // Read existing data
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const existingData = XLSX.utils.sheet_to_json(worksheet) as NominaRow[];
    
    // Combine existing data with new rows
    const updatedData = [...existingData, ...newRows];
    
    // Create a new workbook and worksheet with the updated data
    const newWorkbook = XLSX.utils.book_new();
    const newWorksheet = XLSX.utils.json_to_sheet(updatedData);
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "Sheet1");
    
    // Write to file using the same pattern as empresas/route.ts
    const excelBuffer = XLSX.write(newWorkbook, { type: "buffer", bookType: "xlsx" });
    fs.writeFileSync(filePath, excelBuffer);
    
    return NextResponse.json({ 
      success: true, 
      message: "Datos actualizados correctamente",
      rowsAdded: newRows.length
    });
  } catch (error) {
    console.error("Error updating Excel file:", error);
    return NextResponse.json(
      { error: "Error al actualizar el archivo de nóminas" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { rut, updatedData } = await request.json();
    
    if (!rut || !updatedData) {
      return NextResponse.json(
        { error: "RUT y datos actualizados son requeridos" },
        { status: 400 }
      );
    }

    // Get the path to the Excel file
    const filePath = path.join(process.cwd(), "lib", "data", "ListaNominas.xlsx");
    
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "El archivo de nóminas no existe" },
        { status: 404 }
      );
    }

    // Read existing data
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const existingData = XLSX.utils.sheet_to_json(worksheet) as NominaRow[];
    
    // Find the row to update
    const rowIndex = existingData.findIndex(row => row.Rut === rut);
    
    if (rowIndex === -1) {
      return NextResponse.json(
        { error: "No se encontró la postulación especificada" },
        { status: 404 }
      );
    }

    // Update the row with new data
    existingData[rowIndex] = {
      ...existingData[rowIndex],
      ...updatedData,
      Rut: rut // Ensure RUT is preserved
    };
    
    // Create a new worksheet with the updated data
    const newWorksheet = XLSX.utils.json_to_sheet(existingData);
    workbook.Sheets[firstSheetName] = newWorksheet;
    
    // Write back to file
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    fs.writeFileSync(filePath, excelBuffer);
    
    return NextResponse.json({ 
      success: true, 
      message: "Datos actualizados correctamente",
      updatedRow: existingData[rowIndex]
    });
  } catch (error) {
    console.error("Error updating Excel file:", error);
    return NextResponse.json(
      { error: "Error al actualizar el archivo de nóminas" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { rowId } = await request.json();
    
    if (!rowId) {
      return NextResponse.json(
        { error: "ID de fila es requerido" },
        { status: 400 }
      );
    }

    // Get the path to the Excel file
    const filePath = path.join(process.cwd(), "lib", "data", "ListaNominas.xlsx");
    
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "El archivo de nóminas no existe" },
        { status: 404 }
      );
    }

    // Read existing data
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const existingData = XLSX.utils.sheet_to_json(worksheet) as NominaRow[];
    
    // Find the row to delete
    const rowIndex = existingData.findIndex(row => row.Rut === rowId);
    
    if (rowIndex === -1) {
      return NextResponse.json(
        { error: "No se encontró la fila especificada" },
        { status: 404 }
      );
    }

    // Remove the row
    existingData.splice(rowIndex, 1);
    
    // Create a new worksheet with the updated data
    const newWorksheet = XLSX.utils.json_to_sheet(existingData);
    workbook.Sheets[firstSheetName] = newWorksheet;
    
    // Write back to file
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    fs.writeFileSync(filePath, excelBuffer);
    
    return NextResponse.json({ 
      success: true, 
      message: "Fila eliminada correctamente"
    });
  } catch (error) {
    console.error("Error deleting row from Excel file:", error);
    return NextResponse.json(
      { error: "Error al eliminar la fila del archivo de nóminas" },
      { status: 500 }
    );
  }
} 