# Backend Implementation for Multi-Document Support

To support the new multi-document functionality in the `DocumentStatusCell` component, the backend API needs to be updated as follows:

## Endpoint: GET `/api/postulaciones/nominas/documents`

### Request

- Query parameter: `rowId` (string) - ID of the row to retrieve documents for

### Response

```json
{
  "documents": [
    {
      "id_doc": 1,
      "rowId": "row123",
      "fileName": "document1.pdf",
      "uploadDate": "2023-05-01T12:00:00Z",
      "fileType": "application/pdf",
      "fileSize": 1024
    },
    {
      "id_doc": 2,
      "rowId": "row123",
      "fileName": "document2.pdf",
      "uploadDate": "2023-05-02T12:00:00Z",
      "fileType": "application/pdf",
      "fileSize": 2048
    }
  ]
}
```

## Endpoint: POST `/api/postulaciones/nominas/documents`

### Request

- FormData with:
  - `rowId` (string) - ID of the row to add document to
  - `file` (file) - PDF file to upload
  - `rutEmpresa` (string) - RUT of the company

### Response

```json
{
  "metadata": {
    "id_doc": 3,
    "rowId": "row123",
    "fileName": "document3.pdf",
    "uploadDate": "2023-05-03T12:00:00Z",
    "fileType": "application/pdf",
    "fileSize": 3072
  }
}
```

## Endpoint: DELETE `/api/postulaciones/nominas/documents`

### Request

- Query parameters:
  - `rowId` (string) - ID of the row
  - `id_doc` (number) - ID of the specific document to delete

### Response

```json
{
  "success": true
}
```

## Endpoint: GET `/api/postulaciones/nominas/documents/download`

### Request

- Query parameters:
  - `rowId` (string) - ID of the row
  - `fileName` (string) - Name of the file to download
  - `view` (boolean, optional) - Whether to view the document inline

### Response

Binary file stream with appropriate headers:

- For download: `Content-Disposition: attachment; filename="document.pdf"`
- For viewing: `Content-Disposition: inline; filename="document.pdf"`

## Database Changes

The database schema needs to support multiple documents per row:

```sql
CREATE TABLE documents (
  id_doc SERIAL PRIMARY KEY,
  row_id VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  upload_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  file_type VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  file_path VARCHAR(255) NOT NULL,

  -- Add an index to quickly retrieve all documents for a row
  INDEX idx_row_id (row_id)
);
```

## Storage Considerations

When storing multiple files for the same row:

1. Create a directory structure based on `rowId`
2. Store files with unique names (using original filename or generated names)
3. Track file paths in the database for retrieval

## Migration and Backward Compatibility

To ensure a smooth transition from single-document to multi-document support:

### Database Migration

1. **Create New Table**: First, create the new multi-document table structure
2. **Migrate Existing Data**:
   ```sql
   INSERT INTO documents (id_doc, row_id, file_name, upload_date, file_type, file_size, file_path)
   SELECT id, row_id, file_name, upload_date, 'application/pdf', file_size, file_path
   FROM old_documents_table;
   ```
3. **Maintain Both Tables**: Keep the old table during the transition period

### API Backward Compatibility

The backend API should support both formats during the transition:

1. **GET endpoint**:

   - When querying documents, include both formats in the response:

   ```json
   {
     "exists": true, // Old format
     "metadata": {}, // Old format
     "documents": [] // New format
   }
   ```

2. **POST endpoint**:

   - Accept the same parameters as before
   - Return both the old and new format in the response

3. **DELETE endpoint**:

   - Support deletion by both row ID only (old) and by specific document ID (new)

4. **Download endpoint**:
   - Support both formats: with and without specific file names

### Phased Rollout

1. Deploy the backend changes first, ensuring backward compatibility
2. Update the frontend components to support the new multi-document format
3. After verifying all components work with the new format, remove backward compatibility code

## File Size Limits

- Implement a maximum file size limit (recommended: 10MB per file)
- Ensure proper error handling for oversized files
- Add server-side validation to reject files that exceed the size limit
