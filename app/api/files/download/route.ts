import { NextRequest, NextResponse } from "next/server";
// @ts-ignore
import archiver from "archiver";
import { Buffer } from "buffer";
import { executeQuery } from "@/app/api/db-connection";

// Import document utils
import { getAllDocuments, getDocumentById, DocumentMetadata } from "@/lib/utils/db-document-utils";

// Authentication utilities (commented out until authentication is set up)
// import { getCurrentUser } from "@/lib/auth";

// Track active download processes
let activeDownloadController: ReadableStreamDefaultController | null = null;

/**
 * API route for downloading files as a zip archive
 * 
 * Query parameters:
 * - tableId: Identifier for which table/entity we're downloading files for (optional)
 */
export async function GET(request: NextRequest) {
  try {
    // Cancel any existing download process
    if (activeDownloadController) {
      console.log("Cancelling previous download process");
      try {
        activeDownloadController.error(new Error("Download cancelled - new request received"));
      } catch (error) {
        console.warn("Error cancelling previous download:", error);
      }
      activeDownloadController = null;
    }

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
    //       { status: 401 }
    //     );
    //   }
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
      return new NextResponse(null, { status: 204 });
    }

    console.log(`Encontrados ${documents.length} documentos para incluir en el archivo zip`);
    
    // Create a timestamp for the filename
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${tableId}-files-${timestamp}.zip`;
    const parentFolderName = `${tableId}-files-${timestamp}`;

    // Initialize a ReadableStream for streaming the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Store the controller reference for potential cancellation
          activeDownloadController = controller;
          
          // Create a zip archive
          const archive = archiver("zip", {
            zlib: { level: 5 }, // Compression level
          });

          // Set up a timeout to prevent hanging downloads
          // 15 minutes timeout (900000 ms) - generous timeout for large downloads
          const timeoutDuration = 900000;
          let lastActivityTime = Date.now();
          let timeoutId: NodeJS.Timeout | null = null;
          
          // Function to reset the timeout
          const resetTimeout = () => {
            if (timeoutId) clearTimeout(timeoutId);
            lastActivityTime = Date.now();
            timeoutId = setTimeout(() => {
              const timeSinceLastActivity = Date.now() - lastActivityTime;
              console.error(`Download timeout after ${timeSinceLastActivity}ms of inactivity`);
              controller.error(new Error("Download timeout - no activity for too long"));
            }, timeoutDuration);
          };
          
          // Start the initial timeout
          resetTimeout();

          // Track progress for reporting
          let totalBytes = 0;
          let processedBytes = 0;
          
          // Calculate total size for progress reporting
          for (const doc of documents) {
            if (doc.contenido_documento) {
              totalBytes += doc.contenido_documento.length;
            }
          }
          
          // Send initial progress message
          const progressMessage = JSON.stringify({
            type: 'progress',
            stage: 'preparing',
            total: totalBytes,
            processed: 0,
            percentage: 0
          });
          controller.enqueue(new TextEncoder().encode(progressMessage + '\n'));

          // Handle data chunks from the archive
          archive.on("data", chunk => {
            // Reset timeout on each chunk
            resetTimeout();
            controller.enqueue(chunk);
          });

          // Handle archive finalization
          archive.on("end", () => {
            // Clear timeout when archive is complete
            if (timeoutId) clearTimeout(timeoutId);
            
            // Send completion message
            const completionMessage = JSON.stringify({
              type: 'complete',
              total: totalBytes,
              processed: totalBytes,
              percentage: 100
            });
            controller.enqueue(new TextEncoder().encode(completionMessage + '\n'));
            
            controller.close();
            // Clear the active controller reference
            if (activeDownloadController === controller) {
              activeDownloadController = null;
            }
            console.log("Archive stream closed successfully");
          });

          // Handle errors
          archive.on("error", (err) => {
            // Clear timeout on error
            if (timeoutId) clearTimeout(timeoutId);
            console.error("Error in archive stream:", err);
            
            // Send error message
            const errorMessage = JSON.stringify({
              type: 'error',
              message: err.message || 'Unknown error occurred'
            });
            controller.enqueue(new TextEncoder().encode(errorMessage + '\n'));
            
            controller.error(err);
            // Clear the active controller reference
            if (activeDownloadController === controller) {
              activeDownloadController = null;
            }
          });

          console.log(`Starting to add ${documents.length} documents to archive...`);
          
          // Process documents in smaller batches to avoid memory spikes
          const BATCH_SIZE = 10;
          let processedCount = 0;
          let errorCount = 0;
          
          for (let i = 0; i < documents.length; i += BATCH_SIZE) {
            const batch = documents.slice(i, Math.min(i + BATCH_SIZE, documents.length));
            console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(documents.length/BATCH_SIZE)}...`);
            
            for (const doc of batch) {
              try {
                if (!doc.contenido_documento) {
                  console.warn(`Document ${doc.id_doc} has no content, skipping`);
                  errorCount++;
                  continue;
                }
                
                // Create a folder name based on the rowId (usually RUT)
                const folderName = doc.rowId ? doc.rowId.replace(/[^a-zA-Z0-9-_]/g, '_') : 'unknown';
                
                // Add the file to the archive in a folder structure: parentFolder/rowId/filename
                archive.append(doc.contenido_documento, { 
                  name: `${parentFolderName}/${folderName}/${doc.fileName}` 
                });
                
                // Update progress
                processedBytes += doc.contenido_documento.length;
                const percentage = Math.round((processedBytes / totalBytes) * 100);
                
                // Send progress update
                const progressMessage = JSON.stringify({
                  type: 'progress',
                  stage: 'processing',
                  total: totalBytes,
                  processed: processedBytes,
                  percentage: percentage
                });
                controller.enqueue(new TextEncoder().encode(progressMessage + '\n'));
                
                processedCount++;
              } catch (error) {
                console.warn(`Failed to add document to archive: ${doc.id_doc}`, error);
                errorCount++;
                // Continue with other files even if one fails
              }
            }
            
            // Log progress after each batch
            console.log(`Processed ${processedCount}/${documents.length} documents (${errorCount} errors)`);
          }
          
          // Finalize the archive (this triggers the 'end' event when done)
          archive.finalize();
        } catch (error) {
          console.error("Error creating streaming response:", error);
          
          // Send error message
          const errorMessage = JSON.stringify({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
          });
          controller.enqueue(new TextEncoder().encode(errorMessage + '\n'));
          
          controller.error(error);
          // Clear the active controller reference
          if (activeDownloadController === controller) {
            activeDownloadController = null;
          }
        }
      }
    });

    // Return streaming response
    return new Response(stream, {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${filename}"`,
          // Add a custom header to indicate this is a multipart response
          "X-Content-Type-Options": "multipart/mixed"
        },
      });
    
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
    
    // Process each nomina in the current batch SEQUENTIALLY to avoid too many database connections
    for (const nomina of batch) {
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
    }
    
    // Log progress after each batch
    console.log(`Batch complete. Total documents collected so far: ${documents.length}`);
  }
  
  console.log(`Finished collecting all documents. Total: ${documents.length}`);
  return documents;
} 