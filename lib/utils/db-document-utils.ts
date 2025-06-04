import { executeQuery, executeTransaction } from '@/app/api/db-connection';

export type DocumentMetadata = {
  id_doc?: number;
  rowId: string;
  recordId?: string;
  fileName: string;
  uploadDate: string;
  fileType: string;
  contenido_documento: Buffer | null;
  fileSize: number;
  rutEmpresa?: string;
};

// Get all documents metadata for a specific row
export async function getDocumentMetadata(rowId: string, recordId?: string): Promise<DocumentMetadata | null> {
  try {
    let query = `
      SELECT 
        id_doc, 
        Ruttrabajador as rowId,
        RutEmpresa as rutEmpresa,
        nombre_documento as fileName, 
        'application/pdf' as fileType,
        contenido_documento,
        LENGTH(contenido_documento) as fileSize
      FROM documentosajuntos
      WHERE Ruttrabajador = ? OR (id_nomina = ? AND id_nomina IS NOT NULL)
    `;
    
    // Convert rowId to integer for id_nomina comparison
    const nominaId = parseInt(rowId);
    const params = [rowId, isNaN(nominaId) ? null : nominaId];
    
    // If recordId is provided, add it to the query
    if (recordId) {
      query += ` AND record_id = ?`;
      params.push(recordId);
    }
    
    query += ` LIMIT 1`;
    
    const results = await executeQuery<any[]>(query, params);
    
    if (results && results.length > 0) {
      // Add current date as uploadDate since it's not stored in the DB
      const result = results[0] as DocumentMetadata;
      result.uploadDate = new Date().toISOString();
      return result;
    }
    
    return null;
  } catch (error) {
    console.error('Error reading document metadata from database:', error);
    return null;
  }
}

// Get all documents for a specific row
export async function getAllDocuments(rowId: string, recordId?: string): Promise<DocumentMetadata[]> {
  // TODO: Change the fields, make them match the database
  try {
    let query = `
      SELECT 
        id_doc, 
        Ruttrabajador as rowId,
        RutEmpresa as rutEmpresa,
        nombre_documento as fileName, 
        'application/pdf' as fileType,
        LENGTH(contenido_documento) as fileSize
      FROM documentosajuntos
      WHERE Ruttrabajador = ? OR (id_nomina = ? AND id_nomina IS NOT NULL)
    `;
    
    // Convert rowId to integer for id_nomina comparison
    const nominaId = parseInt(rowId);
    const params = [rowId, isNaN(nominaId) ? null : nominaId];
    
    // If recordId is provided, add it to the query
    if (recordId) {
      query += ` AND record_id = ?`;
      params.push(recordId);
    }
    
    query += ` ORDER BY id_doc DESC`;
    
    const results = await executeQuery<any[]>(query, params);
    
    if (results && results.length > 0) {
      // Add current date as uploadDate since it's not stored in the DB
      return results.map(result => {
        const doc = result as DocumentMetadata;
        doc.uploadDate = new Date().toISOString();
        return doc;
      });
    }
    
    return [];
  } catch (error) {
    console.error('Error reading all documents from database:', error);
    return [];
  }
}

// Get a specific document by its ID
export async function getDocumentById(docId: number): Promise<DocumentMetadata | null> {
  try {
    const query = `
      SELECT 
        id_doc, 
        Ruttrabajador as rowId,
        RutEmpresa as rutEmpresa,
        nombre_documento as fileName, 
        'application/pdf' as fileType,
        contenido_documento,
        LENGTH(contenido_documento) as fileSize
      FROM documentosajuntos
      WHERE id_doc = ?
    `;
    
    const results = await executeQuery<any[]>(query, [docId]);
    
    if (results && results.length > 0) {
      // Add current date as uploadDate since it's not stored in the DB
      const result = results[0] as DocumentMetadata;
      result.uploadDate = new Date().toISOString();
      return result;
    }
    
    return null;
  } catch (error) {
    console.error('Error reading document by ID from database:', error);
    return null;
  }
}

// Get a specific document by row ID and filename
export async function getDocumentByFileName(rowId: string, fileName: string, recordId?: string): Promise<DocumentMetadata | null> {
  try {
    let query = `
      SELECT 
        id_doc, 
        Ruttrabajador as rowId,
        RutEmpresa as rutEmpresa,
        nombre_documento as fileName, 
        'application/pdf' as fileType,
        contenido_documento,
        LENGTH(contenido_documento) as fileSize
      FROM documentosajuntos
      WHERE (Ruttrabajador = ? OR (id_nomina = ? AND id_nomina IS NOT NULL)) AND nombre_documento = ?
    `;
    
    // Convert rowId to integer for id_nomina comparison
    const nominaId = parseInt(rowId);
    const params = [rowId, isNaN(nominaId) ? null : nominaId, fileName];
    
    // If recordId is provided, add it to the query
    if (recordId) {
      query += ` AND record_id = ?`;
      params.push(recordId);
    }
    
    const results = await executeQuery<any[]>(query, params);
    
    if (results && results.length > 0) {
      // Add current date as uploadDate since it's not stored in the DB
      const result = results[0] as DocumentMetadata;
      result.uploadDate = new Date().toISOString();
      return result;
    }
    
    return null;
  } catch (error) {
    console.error('Error reading document by filename from database:', error);
    return null;
  }
}

// Save document metadata and content to database
export async function saveDocument(
  rowId: string,
  fileName: string,
  fileType: string,
  fileContent: Buffer,
  rutEmpresa: string = '',
  recordId?: string,
  rutTrabajador?: string
): Promise<DocumentMetadata | null> {
  try {
    console.log("saveDocument called with:", 
      "rowId:", rowId, 
      "fileName:", fileName, 
      "fileType:", fileType, 
      "fileContentLength:", fileContent?.length || 0,
      "rutEmpresa:", rutEmpresa,
      "recordId:", recordId,
      "rutTrabajador:", rutTrabajador
    );

    if (!rowId || !fileName || !fileContent) {
      console.error("Missing required parameters:", {
        hasRowId: !!rowId,
        hasFileName: !!fileName,
        hasFileContent: !!fileContent,
        fileContentLength: fileContent?.length || 0
      });
      throw new Error("Missing required parameters for saving document");
    }

    // Check if a document with the same filename already exists for this rowId/recordId
    const existingDoc = await getDocumentByFileName(rowId, fileName, recordId);
    if (existingDoc) {
      console.log("Document with the same filename already exists for this worker/record");
      throw new Error("Ya existe un documento con el mismo nombre para este registro");
    }

    // Insert new document
    const query = `
      INSERT INTO documentosajuntos (
        RutEmpresa,
        Ruttrabajador,
        nombre_documento,
        contenido_documento,
        id_nomina
      ) VALUES (?, ?, ?, ?, ?)
    `;
    // Use rutTrabajador if provided, otherwise fall back to rowId
    const rut = rutTrabajador || rowId;
    // Convert rowId to integer for id_nomina, or null if not a valid number
    const nominaId = parseInt(rowId);
    const params = [rutEmpresa, rut, fileName, fileContent, isNaN(nominaId) ? null : nominaId];
    
    console.log("Executing query:", query.replace(/\s+/g, ' '));
    console.log("With params:", JSON.stringify([
      rutEmpresa, 
      rut,
      fileName, 
      fileContent ? "BUFFER_DATA" : null,
      isNaN(nominaId) ? null : nominaId // id_nomina as int
    ]));
    
    try {
      const result = await executeQuery<any>(query, params);
      console.log("Query result:", result);
      
      if (result && result.insertId) {
        console.log("Document inserted with ID:", result.insertId);
        // Return the new document metadata
        try {
          const doc = await getDocumentById(result.insertId);
          console.log("Retrieved document metadata:", doc ? "success" : "null");
          return doc;
        } catch (getError) {
          console.error("Error getting new document after insert:", getError);
          // Return a basic metadata object if we couldn't get the full one
          return {
            // id_doc: result.insertId,
            rowId: rowId,
            recordId: recordId,
            fileName: fileName,
            uploadDate: new Date().toISOString(),
            fileType: fileType,
            contenido_documento: null,
            fileSize: fileContent.length
          };
        }
      }
      
      console.log("No insertId in query result, saving failed");
      return null;
    } catch (queryError) {
      console.error("SQL error during document insert:", queryError);
      throw new Error(`Database error: ${queryError instanceof Error ? queryError.message : 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error saving document to database:', error);
    throw new Error(`Error saving document to database: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Delete a specific document by ID
export async function deleteDocumentById(docId: number): Promise<boolean> {
  try {
    const query = 'DELETE FROM documentosajuntos WHERE id_doc = ?';
    const result = await executeQuery<any>(query, [docId]);
    
    // Check if any rows were affected
    return result && result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting document from database:', error);
    return false;
  }
}

// Delete all documents for a row
export async function deleteDocument(rowId: string, recordId?: string): Promise<boolean> {
  try {
    let query = 'DELETE FROM documentosajuntos WHERE Ruttrabajador = ? OR (id_nomina = ? AND id_nomina IS NOT NULL)';
    // Convert rowId to integer for id_nomina comparison
    const nominaId = parseInt(rowId);
    const params = [rowId, isNaN(nominaId) ? null : nominaId];
    
    // If recordId is provided, only delete documents for that specific record
    if (recordId) {
      query += ' AND record_id = ?';
      params.push(recordId);
    }
    
    const result = await executeQuery<any>(query, params);
    
    // Check if any rows were affected
    return result && result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting document from database:', error);
    return false;
  }
} 