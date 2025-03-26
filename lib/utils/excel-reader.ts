import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

export interface NominaRow {
  Nro?: number;
  RUT?: string;
  'Nombre Completo'?: string;
  Email?: string;
  Celular?: string;
  'Remuneracion Mes 1'?: number;
  'Remuneracion Mes 2'?: number;
  'Remuneracion Mes 3'?: number;
  'Años Mesa'?: number;
  'Ingreso Percapita'?: string;
  'Relacion con el Trabajador'?: string;
  'Tipo Beneficiario'?: string;
  'Promedio de Notas'?: number;
  'Años Antiguedad'?: number;
  'Empresa RUT'?: string;
  'Empresa Nombre'?: string;
  'Cod Plan'?: string;
  'Año Postulacion'?: number;
  'RUT Beneficiario'?: string;
  'Nombre Beneficiario'?: string;
  Direccion?: string;
  Comuna?: string;
  Sucursal?: string;
  Cargo?: string;
  [key: string]: any; // For any other fields in the Excel file
}

export function readNominasExcel(filePath: string): NominaRow[] {
  try {
    // Read the file
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Get the first sheet
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    // Add debug information to console during development
    console.log('First row sample:', jsonData[0]);
    
    return jsonData as NominaRow[];
  } catch (error) {
    console.error('Error reading Excel file:', error);
    return [];
  }
}

// Function to get the absolute path to the Excel file
export function getNominasFilePath(): string {
  return path.join(process.cwd(), 'lib', 'data', 'ListaNominas.xlsx');
}

export interface User {
  ID: number;
  Rut: string;
  Empresa: string;
  Operacion: string;
  Encargado: string;
  Mail: string;
  Telefono: string;
  Empresa_C: string; // Password (plain text in the DB)
}

// Cache for the Excel data to avoid reading the file on every request
let usersCache: User[] | null = null;

/**
 * Get the file path for an Excel file in the standard data directory
 */
function getExcelFilePath(filename: string): string {
  return path.join(process.cwd(), 'lib', 'data', filename);
}

/**
 * Read users from the Excel file
 */
export function readUsersFromExcel(forceRefresh = false): User[] {
  // Return cached data if available and no force refresh
  if (usersCache && !forceRefresh) {
    return usersCache;
  }

  try {
    // Get the standardized file path
    const filename = 'ListaEmpresa.xlsx';
    const filePath = getExcelFilePath(filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`Could not find Excel file: ${filePath}`);
      return [];
    }
    
    console.log('File exists, attempting to read...');

    // Read the Excel file using buffer approach
    const buffer = fs.readFileSync(filePath);
    console.log(`Successfully read ${buffer.length} bytes`);
    
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    console.log('Sheet name:', sheetName);
    
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with headers
    const data = XLSX.utils.sheet_to_json<User>(worksheet);
    console.log(`Successfully read ${data.length} rows, first row:`, data[0]);
    
    // Cache the data
    usersCache = data;
    
    return data;
  } catch (error) {
    console.error('Error reading Excel file:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return [];
  }
}

/**
 * Find a user by RUT
 */
export function findUserByRut(rut: string): User | undefined {
  const users = readUsersFromExcel();
  return users.find(user => user.Rut === rut);
}

/**
 * Find a user by ID
 */
export function findUserById(id: number): User | undefined {
  const users = readUsersFromExcel();
  return users.find(user => user.ID === id);
}

/**
 * Refresh the users cache
 */
export function refreshUsersCache(): User[] {
  return readUsersFromExcel(true);
} 