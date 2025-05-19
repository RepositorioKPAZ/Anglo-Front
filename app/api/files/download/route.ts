import { NextRequest, NextResponse } from "next/server";
// @ts-ignore
import archiver from "archiver";
import { Buffer } from "buffer";
import { executeQuery } from "@/app/api/db-connection";

// Import document utils
import { getAllDocuments, getDocumentById, DocumentMetadata } from "@/lib/utils/db-document-utils";

/**
 * Simplified API route for downloading files as a zip archive
 * 
 * Query parameters:
 * - tableId: Identifier for which table/entity we're downloading files for
 */
export async function GET(request: NextRequest) {
  try {
    /********************************************
     * SECTION 1: PARAMETER VALIDATION
     ********************************************/
    // Extract and validate query parameters
    const { searchParams } = new URL(request.url);
    const tableId = searchParams.get("tableId");
    
    // Validate request
    if (!tableId) {
      return NextResponse.json(
        { error: "Missing required parameter: tableId" },
        { status: 400 }
      );
    }

    // Log the request
    console.log(`File download requested for table: ${tableId}`);
    
    /********************************************
     * SECTION 2: DATABASE DOCUMENT RETRIEVAL
     ********************************************/
    // Fetch relevant documents based on tableId
    let documents: DocumentMetadata[] = [];
    try {
      if (tableId === "nominas") {
        // Get all nomina IDs instead of RUTs
        const nominasQuery = `SELECT ID FROM nominabeca`;
        const nominas = await executeQuery<{ID: number}[]>(nominasQuery);
        console.log(`Found ${nominas.length} nominas`);
        console.log("\n[NOMINAS]", nominas);
        
        if (nominas.length === 0) {
          return NextResponse.json(
            { message: "No hay registros de nóminas en la base de datos" },
            { status: 200 }
          );
        }
        
        // Iterate through each ID and retrieve associated documents
        for (const nomina of nominas) {
          const nominaId = String(nomina.ID);
          const docs = await getAllDocuments(nominaId);
          if (docs && docs.length > 0) {
            for (const doc of docs) {
              if (doc.id_doc) {
                try {
                  // Get full document content for each document ID
                  const fullDoc = await getDocumentById(doc.id_doc);
                  if (fullDoc && fullDoc.contenido_documento) {
                    documents.push(fullDoc);
                  }
                } catch (err) {
                  console.warn(`Could not fetch document ${doc.id_doc}:`, err);
                }
              }
            }
          }
        }
      } else {
        console.log(`Table ${tableId} not supported`);
        return NextResponse.json(
          { message: `La tabla "${tableId}" no está soportada para descarga de archivos` },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Error en la base de datos", message: error instanceof Error ? error.message : "Error desconocido" },
        { status: 500 }
      );
    }

    // Log document count
    console.log(`Found ${documents.length} documents to download`);
    
    // Early return if no documents found
    if (documents.length === 0) {
      return NextResponse.json(
        { message: "No hay archivos disponibles para descargar" }, 
        { status: 200 }
      );
    }
    
    /********************************************
     * SECTION 3: ZIP ARCHIVE CREATION
     ********************************************/
    // Create a simple timestamp-based filename
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${tableId}-files-${timestamp}.zip`;
    
    // Create and return the zip directly - no batching, no progress tracking
    try {
      // Setup for in-memory ZIP creation
      const chunks: Buffer[] = [];
      
      // Initialize archiver with no compression for better performance
      const archive = archiver("zip", { store: true }); // No compression for speed
      
      // Set up error handling for the archiver
      archive.on("warning", err => {
        if (err.code === "ENOENT") {
          console.warn("Archiver warning:", err);
        } else {
          throw err;
        }
      });
      
      // Collect data chunks as they're generated
      archive.on("data", chunk => chunks.push(chunk));
      
      // Setup promise to handle archive completion
      const archivePromise = new Promise<Buffer>((resolve, reject) => {
        archive.on("end", () => {
          const buffer = Buffer.concat(chunks);
          console.log(`Archive created: ${buffer.length} bytes`);
          resolve(buffer);
        });
        
        archive.on("error", err => {
          console.error("Archive error:", err);
          reject(err);
        });
      });
      
      /********************************************
       * SECTION 4: ADDING FILES TO ARCHIVE
       ********************************************/
      let fileCount = 0;
      
      for (const doc of documents) {
        if (doc.contenido_documento && doc.contenido_documento.length > 0) {
          // Create folder name based on document rowId
          const folderName = doc.rowId ? doc.rowId.replace(/[^a-zA-Z0-9-_]/g, '_') : 'unknown';
          try {
            // Log information about the document for debugging
            console.log(`Adding file: ${doc.fileName || 'unnamed'}, Size: ${doc.contenido_documento.length} bytes`);
            
            // Ensure we have a buffer of the right type
            const fileData = Buffer.from(doc.contenido_documento);
            
            // Add document to archive with appropriate path
            archive.append(fileData, { 
              name: `${folderName}/${doc.fileName || `document_${fileCount}`}`
            });
            
            fileCount++;
          } catch (error) {
            console.error(`Error adding file ${doc.fileName || 'unnamed'} to archive:`, error);
          }
        } else {
          console.warn(`Empty document found: ${doc.id_doc}, Filename: ${doc.fileName || 'unnamed'}`);
        }
      }
      
      // Handle case where all documents were invalid
      if (fileCount === 0) {
        return NextResponse.json(
          { message: "Los documentos encontrados están vacíos o son inválidos" }, 
          { status: 200 }
        );
      }
      
      console.log(`Added ${fileCount} files to archive`);
      
      /********************************************
       * SECTION 5: FINALIZING AND RETURNING RESPONSE
       ********************************************/
      // Complete the archive creation process
      archive.finalize();
      
      // Wait for archive to complete
      const zipBuffer = await archivePromise;
      
      // Validate the generated ZIP
      if (!zipBuffer || zipBuffer.length === 0) {
        return NextResponse.json(
          { message: "Error al generar el archivo ZIP: ZIP generado está vacío" }, 
          { status: 500 }
        );
      }
      
      console.log(`Successfully created ZIP with ${fileCount} files, Size: ${zipBuffer.length} bytes`);
      
      // Return the zip file as response with appropriate headers
      return new NextResponse(zipBuffer, {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": zipBuffer.length.toString(),
        }
      });
      
    } catch (error) {
      console.error("Error creating zip:", error);
      return NextResponse.json({ error: "Failed to create zip file" }, { status: 500 });
    }
    
  } catch (error) {
    console.error("General error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 