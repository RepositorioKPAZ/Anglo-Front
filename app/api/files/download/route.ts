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
    const empresaRut = searchParams.get("empresaRut");
    const listEmpresas = searchParams.get("listEmpresas");
    
    // Validate request
    if (!tableId) {
      return NextResponse.json(
        { error: "Missing required parameter: tableId" },
        { status: 400 }
      );
    }

    // Log the request
    console.log(`File download requested for table: ${tableId}`, { empresaRut, listEmpresas });
    
    /********************************************
     * SECTION 2: LIST EMPRESAS MODE
     ********************************************/
    if (listEmpresas === "true") {
      if (tableId === "nominas") {
        // Get list of empresas that have documents
        const empresasQuery = `
          SELECT DISTINCT n.RutEmpresa as empresaRut, COUNT(d.id_doc) as documentCount
          FROM nominabeca n
          INNER JOIN documentosajuntos d ON (d.Ruttrabajador = n.Rut OR d.id_nomina = n.ID)
          WHERE n.RutEmpresa IS NOT NULL AND n.RutEmpresa != ''
          GROUP BY n.RutEmpresa
          HAVING documentCount > 0
          ORDER BY n.RutEmpresa
        `;
        
        const empresas = await executeQuery<{empresaRut: string, documentCount: number}[]>(empresasQuery);
        console.log(`Found ${empresas.length} empresas with documents`);
        
        return NextResponse.json({
          empresas: empresas.map(emp => ({
            rut: emp.empresaRut,
            documentCount: emp.documentCount
          }))
        });
      }
      
      return NextResponse.json({ empresas: [] });
    }
    
    /********************************************
     * SECTION 3: SINGLE EMPRESA DOWNLOAD MODE
     ********************************************/
    if (!empresaRut) {
      return NextResponse.json(
        { error: "Missing required parameter: empresaRut for individual download" },
        { status: 400 }
      );
    }
    
    // Fetch relevant documents based on tableId and empresaRut
    let documents: DocumentMetadata[] = [];
    try {
      if (tableId === "nominas") {
        // Get nomina records for specific empresa with all necessary data for folder structure
        const nominasQuery = `SELECT ID, Rut, RutEmpresa, RutBeneficiario FROM nominabeca WHERE RutEmpresa = ?`;
        const nominas = await executeQuery<{ID: number, Rut: string, RutEmpresa: string, RutBeneficiario: string}[]>(nominasQuery, [empresaRut]);
        console.log(`Found ${nominas.length} nominas for empresa ${empresaRut}`);
        
        if (nominas.length === 0) {
          return NextResponse.json(
            { message: `No hay registros de nóminas para la empresa ${empresaRut}` },
            { status: 200 }
          );
        }
        
        // Track processed document IDs to avoid duplicates
        const processedDocIds = new Set<number>();
        
        // Create a map to associate nomina data with documents
        const nominaMap = new Map<string, {Rut: string, RutEmpresa: string, RutBeneficiario: string}>();
        nominas.forEach(nomina => {
          nominaMap.set(String(nomina.ID), {
            Rut: nomina.Rut || '',
            RutEmpresa: nomina.RutEmpresa || '',
            RutBeneficiario: nomina.RutBeneficiario || ''
          });
        });
        
        // Iterate through each nomina and retrieve associated documents
        for (const nomina of nominas) {
          const nominaId = String(nomina.ID);
          const docs = await getAllDocuments(nominaId);
          
          if (docs && docs.length > 0) {
            for (const doc of docs) {
              if (doc.id_doc && !processedDocIds.has(doc.id_doc)) {
                try {
                  // Track this document to avoid duplicates
                  processedDocIds.add(doc.id_doc);
                  
                  // Get full document content for each document ID
                  const fullDoc = await getDocumentById(doc.id_doc);
                  if (fullDoc && fullDoc.contenido_documento) {
                    // Add nomina metadata to the document for folder structure
                    const nominaData = nominaMap.get(nominaId);
                    if (nominaData) {
                      // Use the empresa RUT from the document itself (more reliable)
                      (fullDoc as any).empresaRut = fullDoc.rutEmpresa || nominaData.RutEmpresa || 'unknown-empresa';
                      (fullDoc as any).beneficiarioRut = nominaData.RutBeneficiario || nominaData.Rut || 'unknown-beneficiario'; // Use RutBeneficiario if available, otherwise fall back to Rut
                      // trabajadorRut comes from Ruttrabajador in the document (stored as rowId)
                      (fullDoc as any).trabajadorRut = fullDoc.rowId || 'unknown-trabajador'; // rowId comes from Ruttrabajador in the document
                      
                    } else {
                      console.warn(`No nomina data found for nominaId: ${nominaId}`);
                      // Set default values when nomina data is not found
                      (fullDoc as any).empresaRut = fullDoc.rutEmpresa || 'unknown-empresa';
                      (fullDoc as any).trabajadorRut = fullDoc.rowId || 'unknown-trabajador';
                      (fullDoc as any).beneficiarioRut = 'unknown-beneficiario';
                    }
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
    console.log(`Found ${documents.length} documents to download for empresa ${empresaRut}`);
    
    // Early return if no documents found
    if (documents.length === 0) {
      return NextResponse.json(
        { message: `No hay archivos disponibles para la empresa ${empresaRut}` }, 
        { status: 200 }
      );
    }
    
    /********************************************
     * SECTION 4: ZIP ARCHIVE CREATION FOR SINGLE EMPRESA
     ********************************************/
    // Create a empresa-specific filename
    const timestamp = new Date().toISOString().slice(0, 10);
    const sanitizedEmpresaRut = empresaRut.replace(/[^a-zA-Z0-9-_]/g, '_');
    const filename = `empresa_${sanitizedEmpresaRut}_${timestamp}.zip`;
    
    // Create and return the zip directly
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
       * SECTION 5: ADDING FILES TO ARCHIVE
       ********************************************/
      let fileCount = 0;
      
      for (const doc of documents) {
        if (doc.contenido_documento && doc.contenido_documento.length > 0) {
          try {
            // Extract folder structure data
            const empresaRut = (doc as any).empresaRut || 'unknown-empresa';
            const trabajadorRut = (doc as any).trabajadorRut || 'unknown-trabajador';
            const beneficiarioRut = (doc as any).beneficiarioRut || 'unknown-beneficiario';
            
            // Sanitize folder names to remove invalid characters
            const sanitizeRut = (rut: string) => rut.replace(/[^a-zA-Z0-9-_]/g, '_');
            const empresaFolder = `emp_${sanitizeRut(empresaRut)}`;
            const trabajadorFolder = `trab_${sanitizeRut(trabajadorRut)}`;
            const beneficiarioFolder = `ben_${sanitizeRut(beneficiarioRut)}`;
            
            // Create hierarchical folder path: empresa/trabajador/beneficiario/file.pdf
            const folderPath = `${empresaFolder}/${trabajadorFolder}/${beneficiarioFolder}`;
            const fileName = doc.fileName || `document_${fileCount}.pdf`;
            const fullPath = `${folderPath}/${fileName}`;
            
            // Log information about the document for debugging
            console.log(`Adding file: ${fullPath}, Size: ${doc.contenido_documento.length} bytes`);
            
            // Ensure we have a buffer of the right type
            const fileData = Buffer.from(doc.contenido_documento);
            
            // Add document to archive with hierarchical path
            archive.append(fileData, { 
              name: fullPath
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
      
      console.log(`Added ${fileCount} files to archive for empresa ${empresaRut}`);
      
      /********************************************
       * SECTION 6: FINALIZING AND RETURNING RESPONSE
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
      
      console.log(`Successfully created ZIP for empresa ${empresaRut} with ${fileCount} files, Size: ${zipBuffer.length} bytes`);
      
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