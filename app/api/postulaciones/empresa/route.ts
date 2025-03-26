import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";
import { NominaRow } from "@/lib/utils/excel-reader";
import { PostulacionEmpresa } from "@/components/tables/columns/postulaciones-empresa-columns";
import { getAuthUser } from "@/app/db-auth-actions";

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
    
    // Map the nominas data to the EmpresaPostulacion format
    const postulacionEmpresaData: PostulacionEmpresa[] = jsonData.map(
      (row, index) => ({
        nro: index,
        rut: row.Rut || "",
        nombreCompleto: row["Nombre Completo"] || "",
        rutBeneficiario: row["Rut Beneficiario"] || "",
        nombreBeneficiario: row["Nombre Beneficiario"] || "",
        tipoBeca: row["Tipo Beca"] || "",
      promedioNotas: row["Promedio de Notas"] || 0,
      rutEmpresa: row["Rut Empresa"] || "",
    }));

    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 });
        }

    console.log('\n[Logging User Data]\n', user)
    console.log('\n[Logging Empresa Data]\n', postulacionEmpresaData)

    const postulacionEmpresaDataFiltered = postulacionEmpresaData.filter(
      (row) => row.rutEmpresa === user.Rut.trim()
    );

    return NextResponse.json(postulacionEmpresaDataFiltered);
  } catch (error) {
    console.error("Error reading Excel file:", error);
    return NextResponse.json(
      { error: "Error al leer el archivo de nóminas" },
      { status: 500 }
    );
  }
} 