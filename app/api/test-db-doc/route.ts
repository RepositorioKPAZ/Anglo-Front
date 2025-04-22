import { NextRequest, NextResponse } from 'next/server';
import { getDocumentTableInfo } from '../test-db-doc-table';

export async function GET(request: NextRequest) {
  try {
    const info = await getDocumentTableInfo();
    
    return NextResponse.json({
      success: true,
      data: info
    });
  } catch (error) {
    console.error('Error in test-db-doc route:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 