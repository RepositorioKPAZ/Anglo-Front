import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";
import { findUserByRut, readUsersFromExcel, User } from "@/lib/utils/excel-reader";

// Helper function to write to Excel file with direct file system operations
async function writeUsersToExcel(users: User[]): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the original file path
    const originalFilePath = path.join(process.cwd(), "lib", "data", "ListaEmpresa.xlsx");
    
    console.log("Creating Excel workbook in memory...");
    // Create workbook in memory
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(users);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    
    // Convert to buffer
    console.log("Converting workbook to buffer...");
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    try {
      // Try to write the buffer to a temp file first
      const tempPath = originalFilePath + '.temp';
      console.log(`Writing to temporary file: ${tempPath}`);
      
      // Write synchronously to ensure it completes
      fs.writeFileSync(tempPath, excelBuffer);
      
      // Check if temp file was created successfully
      if (fs.existsSync(tempPath)) {
        console.log("Temporary file created successfully, renaming to target file");
        
        // Backup the original file if it exists
        if (fs.existsSync(originalFilePath)) {
          const backupPath = originalFilePath + '.bak';
          console.log(`Backing up original file to: ${backupPath}`);
          try {
            fs.copyFileSync(originalFilePath, backupPath);
          } catch (backupError) {
            console.warn("Could not create backup, continuing anyway:", backupError);
          }
          
          // Remove original file to avoid rename conflicts
          try {
            fs.unlinkSync(originalFilePath);
          } catch (unlinkError) {
            console.warn("Could not remove original file:", unlinkError);
          }
        }
        
        // Rename temp file to target file
        try {
          fs.renameSync(tempPath, originalFilePath);
          console.log("Successfully renamed temp file to target file");
          return { success: true };
        } catch (renameError) {
          const renameErrMsg = renameError instanceof Error ? renameError.message : String(renameError);
          console.error("Error renaming temp file:", renameErrMsg);
          
          // Try direct copy as fallback
          try {
            fs.copyFileSync(tempPath, originalFilePath);
            console.log("Successfully copied temp file to target file");
            return { success: true };
          } catch (copyError) {
            const copyErrMsg = copyError instanceof Error ? copyError.message : String(copyError);
            console.error("Error copying temp file:", copyErrMsg);
            return { 
              success: false, 
              error: `Failed to rename or copy temp file: ${renameErrMsg}, ${copyErrMsg}` 
            };
          }
        }
      } else {
        console.error("Failed to create temporary file");
        return { 
          success: false, 
          error: "Could not create temporary file" 
        };
      }
    } catch (writeError) {
      const writeErrMsg = writeError instanceof Error ? writeError.message : String(writeError);
      console.error("Error writing buffer to temp file:", writeErrMsg);
      
      // Attempt to write to public directory as a fallback
      try {
        const publicDir = path.join(process.cwd(), "public");
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }
        
        const publicPath = path.join(publicDir, "ListaEmpresa.xlsx");
        console.log(`Attempting to write to public path: ${publicPath}`);
        
        fs.writeFileSync(publicPath, excelBuffer);
        console.log("Successfully wrote to public path");
        
        try {
          fs.copyFileSync(publicPath, originalFilePath);
          console.log("Successfully copied from public to original path");
          return { success: true };
        } catch (copyBackError) {
          const copyErrMsg = copyBackError instanceof Error ? copyBackError.message : String(copyBackError);
          console.error("Error copying from public to original:", copyErrMsg);
          return { 
            success: false,
            error: `File written to public directory but couldn't be copied back: ${copyErrMsg}`
          };
        }
      } catch (publicWriteError) {
        const publicErrMsg = publicWriteError instanceof Error ? publicWriteError.message : String(publicWriteError);
        console.error("Error writing to public path:", publicErrMsg);
        return { 
          success: false, 
          error: `Failed to write to both original and public paths: ${writeErrMsg}, ${publicErrMsg}`
        };
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("General error in writeUsersToExcel:", errorMsg);
    return { success: false, error: errorMsg };
  }
}

// GET: Retrieve a user's password by their RUT
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const rut = url.searchParams.get("rut");

    if (!rut) {
      return NextResponse.json(
        { error: "RUT parameter is required" },
        { status: 400 }
      );
    }

    const user = findUserByRut(rut);
    
    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ password: user.Empresa_C });
  } catch (error) {
    console.error("Error retrieving password:", error);
    return NextResponse.json(
      { error: "Error al recuperar la contraseña" },
      { status: 500 }
    );
  }
}

// PATCH: Update a user's password by their RUT
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { rut, newPassword } = body;

    if (!rut || !newPassword) {
      return NextResponse.json(
        { error: "RUT y nueva contraseña son requeridos" },
        { status: 400 }
      );
    }

    // Input validation
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Get all users
    const users = readUsersFromExcel();
    const userIndex = users.findIndex(user => user.Rut === rut);
    
    if (userIndex === -1) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Update the user's password in the array
    users[userIndex].Empresa_C = newPassword;

    // Try to write to the Excel file with detailed error handling
    const writeResult = await writeUsersToExcel(users);
    
    if (!writeResult.success) {
      console.error("Failed to write Excel file:", writeResult.error);
      return NextResponse.json(
        { 
          error: "No fue posible guardar la contraseña en el archivo Excel. " + 
                 "Detalle: " + (writeResult.error || "Error desconocido")
        },
        { status: 500 }
      );
    }

    // Log the change for audit purposes
    console.log(`Password changed for user with RUT ${rut} at ${new Date().toISOString()}`);
    
    // Return success
    return NextResponse.json({ 
      success: true,
      message: "Contraseña actualizada correctamente" 
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Error in password update operation:", errorMsg);
    
    return NextResponse.json(
      { error: "Error al actualizar la contraseña: " + errorMsg },
      { status: 500 }
    );
  }
} 