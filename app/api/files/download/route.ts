import { NextRequest, NextResponse } from "next/server";
// @ts-ignore
import archiver from "archiver";
import { Buffer } from "buffer";
import { executeQuery } from "@/app/api/db-connection";

// Import document utils
import { getAllDocuments, getDocumentById, DocumentMetadata } from "@/lib/utils/db-document-utils";

// Authentication utilities (commented out until authentication is set up)
// import { getCurrentUser } from "@/lib/auth";

/**
 * API route for downloading files as a zip archive
 * 
 * Query parameters:
 * - tableId: Identifier for which table/entity we're downloading files for (optional)
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check - Uncomment this code when authentication is set up
    // =========================================================================
    // try {
    //   const user = await getCurrentUser();
    //   if (!user || user.role !== 'admin') {
    //     return NextResponse.json(
    //       { error: "Unauthorized. Admin access required." },
    //       { status: 401 }
    //     );
    //   }
    // } catch (authError) {
    //   console.error("Authentication error:", authError);
    //   return NextResponse.json(
    //     { error: "Authentication failed" },
    //     { status: 401 }
    //   );
    // }
    // =========================================================================

    const { searchParams } = new URL(request.url);
    const tableId = searchParams.get("tableId");
    
    // Validate request
    if (!tableId) {
      return NextResponse.json(
        { error: "Missing required parameter: tableId" },
        { status: 400 }
      );
    }

    // Log the request for debugging
    console.log(`File download requested for table: ${tableId}`);
    
    // Fetch all file data based on table type
    let documents: DocumentMetadata[] = [];
    try {
      if (tableId === "nominas") {
        // For nominas, get all rows with their RUT values first
        console.log("Obteniendo todos los RUTs de las nominas de la base de datos");
        
        const nominasQuery = `SELECT Rut FROM nominabeca`;
        const nominas = await executeQuery<{Rut: string}[]>(nominasQuery);
        
        console.log(`Encontrados ${nominas.length} filas de nominas`);
        
        // Then fetch all documents for these IDs
        documents = await getDocumentsForNominas(nominas);
      } else {
        // For other tables, use a table-specific approach
        console.log(`Tabla ${tableId} no soporta descargas de archivos por ahora`);
      }
    } catch (dbError) {
      console.error("Error al obtener la información de los documentos de la base de datos:", dbError);
      return NextResponse.json(
        { error: "Error obteniendo la información de los documentos de la base de datos" },
        { status: 500 }
      );
    }

    if (!documents || documents.length === 0) {
      console.log("No se encontraron documentos para la tabla especificada");
      return NextResponse.json(
        { error: "No se encontraron documentos para la tabla especificada" },
        { status: 404 }
      );
    }

    console.log(`Encontrados ${documents.length} documentos para incluir en el archivo zip`);
    
    // Create a zip file with all the retrieved documents
    try {
      const { zipBuffer, filename } = await createZipWithDocuments(documents, tableId);
      
      console.log(`Archivo zip creado: ${filename}, tamaño: ${zipBuffer.length} bytes`);
      
      // Return the zip file as a downloadable response
      return new NextResponse(zipBuffer, {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": zipBuffer.length.toString(),
        },
      });
    } catch (zipError) {
      console.error("Error al crear el archivo zip:", zipError);
      return NextResponse.json(
        { error: "Error al crear el archivo zip" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error en la API de descarga de archivos:", error);
    return NextResponse.json(
      { error: "Error al procesar la descarga de archivos" },
      { status: 500 }
    );
  }
}

/**
 * Gets all documents for a list of nominas by their RUT values
 */
async function getDocumentsForNominas(nominas: {Rut: string}[]): Promise<DocumentMetadata[]> {
  const documents: DocumentMetadata[] = [];
  
  // Process in batches to avoid memory issues with large document sets
  const BATCH_SIZE = 20; // Adjust based on average document size
  
  // Log progress
  console.log(`Starting to fetch documents for ${nominas.length} nominas in batches of ${BATCH_SIZE}`);
  
  // Process nominas in batches
  for (let i = 0; i < nominas.length; i += BATCH_SIZE) {
    const batch = nominas.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(nominas.length/BATCH_SIZE)}, items ${i+1}-${Math.min(i+BATCH_SIZE, nominas.length)}`);
    
    // Process each nomina in the current batch
    const batchPromises = batch.map(async (nomina) => {
      try {
        const docsForNomina = await getAllDocuments(nomina.Rut);
        if (docsForNomina && docsForNomina.length > 0) {
          console.log(`Found ${docsForNomina.length} documents for RUT ${nomina.Rut}`);
          
          // For each document metadata, get the full document with content
          for (const docMeta of docsForNomina) {
            if (docMeta.id_doc) {
              try {
                const fullDoc = await getDocumentById(docMeta.id_doc);
                if (fullDoc && fullDoc.contenido_documento) {
                  documents.push(fullDoc);
                }
              } catch (docError) {
                console.warn(`Error fetching document ${docMeta.id_doc} for RUT ${nomina.Rut}:`, docError);
                // Continue with other documents even if one fails
              }
            }
          }
        }
      } catch (nominaError) {
        console.warn(`Error fetching documents for RUT ${nomina.Rut}:`, nominaError);
        // Continue with other nominas even if one fails
      }
    });
    
    // Wait for all promises in this batch to complete
    await Promise.all(batchPromises);
    
    // Log progress after each batch
    console.log(`Batch complete. Total documents collected so far: ${documents.length}`);
  }
  
  console.log(`Finished collecting all documents. Total: ${documents.length}`);
  return documents;
}

/**
 * Creates a zip archive from database documents
 */
async function createZipWithDocuments(documents: DocumentMetadata[], tableId: string) {
  // Create a zip archive
  const archive = archiver("zip", {
    zlib: { level: 5 }, // Compression level
  });

  // Create buffers for collecting the archive data
  const chunks: Buffer[] = [];

  // Set up the archive to write to our buffer
  archive.on("data", (chunk: any) => chunks.push(Buffer.from(chunk)));

  // Track documents added to provide status
  let addedCount = 0;
  let errorCount = 0;

  // For each document, add it to the archive
  for (const doc of documents) {
    try {
      if (!doc.contenido_documento) {
        console.warn(`Document ${doc.id_doc} has no content, skipping`);
        errorCount++;
        continue;
      }
      
      // Create a folder name based on the rowId (usually RUT)
      const folderName = doc.rowId ? doc.rowId.replace(/[^a-zA-Z0-9-_]/g, '_') : 'unknown';
      
      // Add the file to the archive in a folder named after the rowId
      archive.append(doc.contenido_documento, { 
        name: `${folderName}/${doc.fileName}` 
      });
      
      addedCount++;
    } catch (error) {
      console.warn(`Failed to add document to archive: ${doc.id_doc}`, error);
      errorCount++;
      // Continue with other files even if one fails
    }
  }

  // Finalize the archive
  archive.finalize();

  // Log status
  console.log(`Added ${addedCount} documents to archive, ${errorCount} failed`);

  // Return a promise that resolves when the archive is finalized
  return new Promise<{ zipBuffer: Buffer; filename: string }>((resolve) => {
    archive.on("end", () => {
      const zipBuffer = Buffer.concat(chunks);
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `${tableId}-files-${timestamp}.zip`;
      resolve({ zipBuffer, filename });
    });
  });
} 