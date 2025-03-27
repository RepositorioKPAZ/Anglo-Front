import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";
import { User } from "@/lib/utils/excel-reader";

export async function PATCH(request: Request) {
  try {
    const { rut, newPassword } = await request.json();

    if (!rut || !newPassword) {
      return NextResponse.json(
        { error: "RUT y nueva contraseña son requeridos" },
        { status: 400 }
      );
    }

    // Get the file path
    const filePath = path.join(process.cwd(), "lib", "data", "ListaEmpresa.xlsx");

    // Read the Excel file
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<User>(worksheet);

    // Find the row with the matching RUT
    const rowIndex = data.findIndex((row) => row.Rut === rut);

    if (rowIndex === -1) {
      return NextResponse.json(
        { error: "Empresa no encontrada" },
        { status: 404 }
      );
    }

    // Update the password
    data[rowIndex].Empresa_C = newPassword;

    // Convert back to worksheet
    const newWorksheet = XLSX.utils.json_to_sheet(data);
    workbook.Sheets[workbook.SheetNames[0]] = newWorksheet;

    // Write back to file
    const newBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    fs.writeFileSync(filePath, newBuffer);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating password:", error);
    return NextResponse.json(
      { error: "Error al actualizar la contraseña" },
      { status: 500 }
    );
  }
} 