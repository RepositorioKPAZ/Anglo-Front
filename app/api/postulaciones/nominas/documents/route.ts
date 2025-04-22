import { NextRequest, NextResponse } from "next/server";
import {
  getDocumentMetadata,
  getAllDocuments,
  saveDocument,
  deleteDocument,
  deleteDocumentById
} from "@/lib/utils/db-document-utils";

// GET endpoint to get all documents for a specific row
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

    // For backward compatibility, get single document metadata
    const documentMetadata = await getDocumentMetadata(rowId);
    
    // Get all documents for this row
    const documents = await getAllDocuments(rowId);
    
    // Backward compatibility: return both formats
    if (documentMetadata && documentMetadata.contenido_documento) {
      const { contenido_documento, ...metadataWithoutContent } = documentMetadata;
      return NextResponse.json({
        exists: true,
        metadata: metadataWithoutContent,
        documents: documents,
      });
    }

    return NextResponse.json({
      exists: !!documentMetadata,
      metadata: documentMetadata,
      documents: documents,
    });
  } catch (error) {
    console.error("Error checking documents:", error);
    return NextResponse.json(
      { error: "Error al verificar los documentos" },
      { status: 500 }
    );
  }
}

// POST endpoint to upload a document
export async function POST(request: NextRequest) {
  try {
    console.log("POST request received to upload document");
    
    const formData = await request.formData();
    
    const rowId = formData.get("rowId") as string;
    const file = formData.get("file") as File;
    const rutEmpresa = formData.get("rutEmpresa") as string || '';
    
    console.log("Form data received:", 
      "rowId:", rowId, 
      "fileName:", file?.name, 
      "fileSize:", file?.size, 
      "fileType:", file?.type,
      "rutEmpresa:", rutEmpresa
    );

    if (!rowId || !file) {
      console.error("Missing required fields:", !rowId ? "rowId" : "file");
      return NextResponse.json(
        { error: "ID de fila y archivo son requeridos" },
        { status: 400 }
      );
    }

    // Verify it's a PDF file
    if (file.type !== "application/pdf") {
      console.error("Invalid file type:", file.type);
      return NextResponse.json(
        { error: "Solo se permiten archivos PDF" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      console.error("File too large:", file.size, "Max size:", maxSize);
      return NextResponse.json(
        { error: `El archivo es demasiado grande. Tamaño máximo: 10MB` },
        { status: 400 }
      );
    }

    // Use the original file name
    const fileName = file.name;
    
    // Convert file to buffer
    console.log("Converting file to buffer");
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log("Buffer created, size:", buffer.length);

    // Save to database (now always saves as a new document)
    console.log("Saving document to database");
    try {
      const metadata = await saveDocument(
        rowId,
        fileName,
        file.type,
        buffer,
        rutEmpresa
      );
      console.log("Document saved successfully, metadata:", metadata ? "received" : "null");

      // Return success response without the actual document content
      if (metadata && metadata.contenido_documento) {
        const { contenido_documento, ...metadataWithoutContent } = metadata;
        
        // For backward compatibility also get the single document
        console.log("Getting single document for backward compatibility");
        const singleDoc = await getDocumentMetadata(rowId);
        const singleDocExists = !!singleDoc;
        let singleDocData = null;
        
        if (singleDoc && singleDoc.contenido_documento) {
          const { contenido_documento, ...singleDocWithoutContent } = singleDoc;
          singleDocData = singleDocWithoutContent;
        } else {
          singleDocData = singleDoc;
        }
        
        const response = {
          success: true,
          // New format
          metadata: metadataWithoutContent,
          // Old format
          exists: singleDocExists,
          document: singleDocData
        };
        
        console.log("Sending successful response:", JSON.stringify({
          ...response,
          metadata: response.metadata ? { ...response.metadata, contenido_documento: "CONTENT_REMOVED" } : null,
          document: response.document ? { ...response.document, contenido_documento: "CONTENT_REMOVED" } : null
        }));
        
        return NextResponse.json(response);
      }
      
      console.log("Document saved but no metadata returned");
      return NextResponse.json({
        success: !!metadata,
        metadata: metadata,
        exists: false,
        document: null
      });
    } catch (dbError) {
      console.error("Database error while saving document:", dbError);
      throw dbError; // Re-throw to be caught by the outer try-catch
    }
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
    const docId = url.searchParams.get("id_doc");

    if (!rowId) {
      return NextResponse.json(
        { error: "El ID de la fila es requerido" },
        { status: 400 }
      );
    }

    let success = false;
    
    // If docId is provided, delete specific document
    if (docId && !isNaN(parseInt(docId))) {
      success = await deleteDocumentById(parseInt(docId));
    } else {
      // For backward compatibility, delete all documents for this row
      success = await deleteDocument(rowId);
    }

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