import { NextRequest, NextResponse } from "next/server";
import { getDocumentMetadata, getDocumentById, getDocumentByFileName } from "@/lib/utils/db-document-utils";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const rowId = url.searchParams.get("rowId");
    const fileName = url.searchParams.get("fileName");
    const docId = url.searchParams.get("id_doc");
    const isView = url.searchParams.get("view") === "true";

    if (!rowId) {
      return NextResponse.json(
        { error: "El ID de la fila es requerido" },
        { status: 400 }
      );
    }

    // Different ways to get the document based on the parameters provided
    let metadata;
    
    if (docId && !isNaN(parseInt(docId))) {
      // Get by document ID
      metadata = await getDocumentById(parseInt(docId));
    } else if (fileName) {
      // Get by row ID and filename
      metadata = await getDocumentByFileName(rowId, fileName);
    } else {
      // Fallback to legacy method - get the first document for this row
      metadata = await getDocumentMetadata(rowId);
    }

    if (!metadata) {
      return NextResponse.json(
        { error: "No se encontró el documento" },
        { status: 404 }
      );
    }

    if (!metadata.contenido_documento) {
      return NextResponse.json(
        { error: "El contenido del documento no está disponible" },
        { status: 404 }
      );
    }

    // Set the appropriate headers
    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    
    // If viewing, set inline disposition; otherwise, use attachment for download
    if (isView) {
      headers.set("Content-Disposition", `inline; filename="${metadata.fileName}"`);
    } else {
      headers.set("Content-Disposition", `attachment; filename="${metadata.fileName}"`);
    }

    // Return the document buffer directly from the database
    return new NextResponse(metadata.contenido_documento, {
      headers,
    });
  } catch (error) {
    console.error("Error downloading document:", error);
    return NextResponse.json(
      { error: "Error al descargar el documento" },
      { status: 500 }
    );
  }
} 