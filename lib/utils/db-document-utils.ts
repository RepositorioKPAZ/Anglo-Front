import { executeQuery, executeTransaction } from '@/app/api/db-connection';

export type DocumentMetadata = {
  id_doc?: number;
  rowId: string;
  fileName: string;
  uploadDate: string;
  fileType: string;
  contenido_documento: Buffer | null;
  fileSize: number;
};

// Get document metadata for a specific row
export async function getDocumentMetadata(rowId: string): Promise<DocumentMetadata | null> {
  try {
    const query = `
      SELECT 
        id_doc, 
        Ruttrabajador as rowId, 
        nombre_documento as fileName, 
        'application/pdf' as fileType,
        contenido_documento,
        LENGTH(contenido_documento) as fileSize
      FROM documentosajuntos
      WHERE Ruttrabajador = ?
      LIMIT 1
    `;
    
    const results = await executeQuery<any[]>(query, [rowId]);
    
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

// Save document metadata and content to database
export async function saveDocument(
  rowId: string,
  fileName: string,
  fileType: string,
  fileContent: Buffer,
  rutEmpresa: string = ''
): Promise<DocumentMetadata | null> {
  try {
    // First check if document already exists
    const existingDoc = await getDocumentMetadata(rowId);
    
    let query;
    let params;
    
    if (existingDoc) {
      // Update existing document
      query = `
        UPDATE documentosajuntos
        SET 
          nombre_documento = ?,
          contenido_documento = ?
        WHERE Ruttrabajador = ?
      `;
      params = [fileName, fileContent, rowId];
    } else {
      // Insert new document
      query = `
        INSERT INTO documentosajuntos (
          RutEmpresa,
          Ruttrabajador,
          nombre_documento,
          contenido_documento
        ) VALUES (?, ?, ?, ?)
      `;
      params = [rutEmpresa, rowId, fileName, fileContent];
    }
    
    await executeQuery(query, params);
    
    // Return the updated metadata
    return await getDocumentMetadata(rowId);
  } catch (error) {
    console.error('Error saving document to database:', error);
    throw new Error('Error saving document to database');
  }
}

// Delete document from database
export async function deleteDocument(rowId: string): Promise<boolean> {
  try {
    const query = 'DELETE FROM documentosajuntos WHERE Ruttrabajador = ?';
    const result = await executeQuery<any>(query, [rowId]);
    
    // Check if any rows were affected
    return result && result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting document from database:', error);
    return false;
  }
} 