import fs from 'fs';
import path from 'path';

export type DocumentMetadata = {
  rowId: string;  // Typically the Rut as a unique identifier
  fileName: string;
  uploadDate: string;
  fileType: string;
  filePath: string;
  fileSize: number;  // in bytes
};

export const DOCUMENTS_DIR = path.join(process.cwd(), 'public', 'uploads', 'documents', 'nominas');
export const METADATA_FILE = path.join(process.cwd(), 'lib', 'data', 'document_metadata.json');

// Ensure the directories exist
export function ensureDirectoriesExist(): void {
  const nominasDir = path.join(process.cwd(), 'public', 'uploads', 'documents', 'nominas');
  
  if (!fs.existsSync(nominasDir)) {
    fs.mkdirSync(nominasDir, { recursive: true });
  }
}

// Get document metadata for a specific row
export function getDocumentMetadata(rowId: string): DocumentMetadata | null {
  try {
    // Ensure the metadata file exists with an empty array
    if (!fs.existsSync(METADATA_FILE)) {
      const dir = path.dirname(METADATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(METADATA_FILE, '[]', 'utf-8');
    }

    const data = fs.readFileSync(METADATA_FILE, 'utf-8');
    const metadata: DocumentMetadata[] = JSON.parse(data);
    return metadata.find(doc => doc.rowId === rowId) || null;
  } catch (error) {
    console.error('Error reading document metadata:', error);
    // If there's an error reading the file, try to recreate it
    try {
      const dir = path.dirname(METADATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(METADATA_FILE, '[]', 'utf-8');
    } catch (recreateError) {
      console.error('Error recreating metadata file:', recreateError);
    }
    return null;
  }
}

// Get all document metadata
export function getAllDocumentMetadata(): DocumentMetadata[] {
  try {
    if (!fs.existsSync(METADATA_FILE)) {
      fs.writeFileSync(METADATA_FILE, '[]', 'utf-8');
      return [];
    }

    const data = fs.readFileSync(METADATA_FILE, 'utf-8');
    return JSON.parse(data) as DocumentMetadata[];
  } catch (error) {
    console.error('Error reading all document metadata:', error);
    return [];
  }
}

// Save document metadata
export function saveDocumentMetadata(metadata: DocumentMetadata): void {
  try {
    ensureDirectoriesExist();
    
    const allMetadata = getAllDocumentMetadata();
    const existingIndex = allMetadata.findIndex(doc => doc.rowId === metadata.rowId);
    
    if (existingIndex !== -1) {
      // Update existing metadata
      allMetadata[existingIndex] = metadata;
    } else {
      // Add new metadata
      allMetadata.push(metadata);
    }
    
    fs.writeFileSync(METADATA_FILE, JSON.stringify(allMetadata, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving document metadata:', error);
    throw new Error('Error saving document metadata');
  }
}

// Delete document metadata and file
export function deleteDocument(rowId: string): boolean {
  try {
    const metadata = getDocumentMetadata(rowId);
    if (!metadata) return false;
    
    // Delete the file
    const filePath = path.join(process.cwd(), 'public', metadata.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Update metadata file
    const allMetadata = getAllDocumentMetadata();
    const updatedMetadata = allMetadata.filter(doc => doc.rowId !== rowId);
    fs.writeFileSync(METADATA_FILE, JSON.stringify(updatedMetadata, null, 2), 'utf-8');
    
    return true;
  } catch (error) {
    console.error('Error deleting document:', error);
    return false;
  }
}

// Create a safe filename from the original name
export function createSafeFileName(rowId: string, originalFileName: string): string {
  // Remove special characters, replace spaces with underscores
  const timestamp = Date.now();
  const extension = path.extname(originalFileName);
  const safeName = rowId.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  
  return `${safeName}_${timestamp}${extension}`;
}

// Get the relative path for a document
export function getDocumentRelativePath(rowId: string, fileName: string): string {
  return `/uploads/documents/nominas/${fileName}`;
} 