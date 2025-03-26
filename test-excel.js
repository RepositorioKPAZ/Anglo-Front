const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Path to Excel file
const filePath = path.join(process.cwd(), 'lib', 'data', 'ListaEmpresa.xlsx');

console.log('File path:', filePath);
console.log('File exists:', fs.existsSync(filePath));

try {
  // Try reading the file with basic Node.js
  const stats = fs.statSync(filePath);
  console.log('File size:', stats.size, 'bytes');
  
  // Try reading with buffer
  const buffer = fs.readFileSync(filePath);
  console.log('Buffer length:', buffer.length);
  
  // Try reading with XLSX
  const workbook = XLSX.readFile(filePath);
  console.log('Sheet names:', workbook.SheetNames);
  
  // Get the first sheet
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const data = XLSX.utils.sheet_to_json(worksheet);
  console.log('First row of data:', data[0]);
  console.log('Number of rows:', data.length);
  
  // Check column names
  if (data.length > 0) {
    console.log('Column names:', Object.keys(data[0]));
    
    // Check if the User interface columns exist
    const requiredColumns = ['ID', 'Rut', 'Empresa', 'Empresa_C'];
    for (const col of requiredColumns) {
      if (!Object.keys(data[0]).includes(col)) {
        console.log(`WARNING: Column '${col}' not found in Excel file`);
      }
    }
  }
  
  console.log('Excel file read successfully');
} catch (error) {
  console.error('Error reading Excel file:', error);
} 