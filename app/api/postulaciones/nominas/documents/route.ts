import { NextRequest, NextResponse } from "next/server";
import {
  getDocumentMetadata,
  saveDocument,
  deleteDocument,
  createSafeFileName
} from "@/lib/utils/db-document-utils";

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

    const documentMetadata = await getDocumentMetadata(rowId);
    
    // We don't want to return the actual document content in the metadata
    if (documentMetadata && documentMetadata.contenido_documento) {
      const { contenido_documento, ...metadataWithoutContent } = documentMetadata;
      return NextResponse.json({
        exists: true,
        metadata: metadataWithoutContent,
      });
    }

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
    const rutEmpresa = formData.get("rutEmpresa") as string || '';

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

    // Create safe filename
    const safeFileName = createSafeFileName(rowId, file.name);
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to database
    const metadata = await saveDocument(
      rowId,
      file.name, //safeFileName,
      file.type,
      buffer,
      rutEmpresa
    );

    // Return success response without the actual document content
    if (metadata && metadata.contenido_documento) {
      const { contenido_documento, ...metadataWithoutContent } = metadata;
      return NextResponse.json({
        success: true,
        metadata: metadataWithoutContent,
      });
    }

    return NextResponse.json({
      success: !!metadata,
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

    const success = await deleteDocument(rowId);

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