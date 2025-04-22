import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from '../db-connection';

export async function GET(request: NextRequest) {
  try {
    // Simple text buffer for testing
    const testBuffer = Buffer.from('This is a test document');
    
    // Insert a test document
    const result = await executeQuery(`
      INSERT INTO documentosajuntos (
        RutEmpresa,
        Ruttrabajador,
        nombre_documento,
        contenido_documento
      ) VALUES (?, ?, ?, ?)
    `, ['76.322.146-6', '12345678-9', 'test_document.txt', testBuffer]);
    
    return NextResponse.json({
      success: true,
      message: 'Test document created successfully',
      result
    });
  } catch (error) {
    console.error('Error creating test document:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 