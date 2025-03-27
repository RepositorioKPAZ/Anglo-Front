import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import fs from "fs";
import { 
  DOCUMENTS_DIR,
  createSafeFileName, 
  getDocumentRelativePath, 
  saveDocumentMetadata,
  getDocumentMetadata,
  deleteDocument,
  ensureDirectoriesExist
} from "@/lib/utils/document-utils";

// GET endpoint to check if a document exists for a specific row
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const rowId = url.searchParams.get("rowId");

    if (!rowId) {
      return NextResponse.json(
        { error: "El ID de la fila es requerido" },
        { status: 400 }
      );
    }

    const documentMetadata = getDocumentMetadata(rowId);

    return NextResponse.json({
      exists: !!documentMetadata,
      metadata: documentMetadata,
    });
  } catch (error) {
    console.error("Error checking document:", error);
    return NextResponse.json(
      { error: "Error al verificar el documento" },
      { status: 500 }
    );
  }
}

// POST endpoint to upload a document
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const rowId = formData.get("rowId") as string;
    const file = formData.get("file") as File;

    if (!rowId || !file) {
      return NextResponse.json(
        { error: "ID de fila y archivo son requeridos" },
        { status: 400 }
      );
    }

    // Verify it's a PDF file
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Solo se permiten archivos PDF" },
        { status: 400 }
      );
    }

    // Create safe filename and prepare file path
    const safeFileName = createSafeFileName(rowId, file.name);
    const relativePath = getDocumentRelativePath(rowId, safeFileName);
    const absolutePath = path.join(process.cwd(), "public", relativePath);
    
    // Ensure the directory exists
    ensureDirectoriesExist();
    
    // Convert file to buffer and save it
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(absolutePath, buffer);

    // Save metadata
    const metadata = {
      rowId,
      fileName: safeFileName,
      uploadDate: new Date().toISOString(),
      fileType: file.type,
      filePath: relativePath,
      fileSize: buffer.length,
    };
    
    saveDocumentMetadata(metadata);

    return NextResponse.json({
      success: true,
      metadata,
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    return NextResponse.json(
      { error: "Error al subir el documento" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove a document
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const rowId = url.searchParams.get("rowId");

    if (!rowId) {
      return NextResponse.json(
        { error: "El ID de la fila es requerido" },
        { status: 400 }
      );
    }

    const success = deleteDocument(rowId);

    if (!success) {
      return NextResponse.json(
        { error: "No se encontró ningún documento para eliminar" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Documento eliminado correctamente",
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Error al eliminar el documento" },
      { status: 500 }
    );
  }
} 