import { executeQuery } from './db-connection';
import { NextResponse } from 'next/server';

export async function getDocumentTableInfo() {
  try {
    // Get table structure
    const tableInfo = await executeQuery<any[]>(`
      DESCRIBE documentosajuntos
    `);
    
    // Get sample data (without content)
    const sampleData = await executeQuery<any[]>(`
      SELECT 
        id_doc, 
        RutEmpresa,
        Ruttrabajador, 
        nombre_documento,
        LENGTH(contenido_documento) as content_size
      FROM documentosajuntos
      LIMIT 5
    `);
    
    // Count total documents
    const countResult = await executeQuery<any[]>(`
      SELECT COUNT(*) as count FROM documentosajuntos
    `);
    
    return {
      tableStructure: tableInfo,
      sampleData: sampleData,
      totalDocuments: countResult[0]?.count || 0
    };
  } catch (error) {
    console.error('Error getting document table info:', error);
    throw error;
  }
} 