# File Download Feature Documentation

This document describes the implementation of the file download feature in the DataTable component.

## Overview

The file download feature allows admin users to download all files associated with rows in specific tables. The implementation follows a server-side approach where:

1. The client initiates a download request by clicking a dedicated button
2. The server retrieves all files directly from the database
3. The server creates a zip archive with the files organized by user
4. The client automatically downloads the resulting zip file

## Implementation Details

### Client-Side Components

1. **DataTable Component**: Enhanced with three new props:

   - `enableFileDownload`: Boolean flag to enable/disable the feature
   - `fileDownloadUrl`: API endpoint URL to request files from
   - `fileDownloadParams`: Additional parameters to send to the API

2. **Download Button**: Appears only when the feature is enabled, with:
   - Loading state indicator during download
   - Progress feedback via toast notifications
   - File size reporting on completion

### Server-Side Components

1. **API Endpoint**: `/api/files/download`

   - Accepts a `tableId` parameter to identify which table's files to download
   - Retrieves file data directly from the database
   - Processes documents in batches to handle large data sets
   - Creates a zip archive with files organized by user (RUT)
   - Returns the archive with appropriate headers for browser download

2. **Database Integration**:
   - Files are stored in the `documentosajuntos` table as BLOBs
   - Associated with users via the `Ruttrabajador` field
   - Downloaded and packaged on-demand when requested

## Production Implementation

### Database Schema

The implementation leverages the existing database schema:

- `nominabeca`: Contains user information with unique RUT identifiers
- `documentosajuntos`: Contains document files with relationships to users

### Performance Optimizations

1. **Batch Processing**:

   - Documents are processed in batches of 20 to avoid memory issues
   - Each batch is processed concurrently for efficiency
   - Progress logging helps monitor long-running operations

2. **Error Handling**:

   - Robust error handling at multiple levels
   - Failed document retrievals don't stop the entire process
   - Detailed logging for troubleshooting

3. **User Experience**:
   - Progressive feedback via toast notifications
   - File size reporting on completion
   - Properly structured zip files for easy organization

## How to Use

### Enabling in a Specific Table

To enable file downloads for a specific table component:

```tsx
<DataTable
  // Existing props...
  enableFileDownload={true}
  fileDownloadUrl="/api/files/download"
  fileDownloadParams={{ tableId: "nominas" }}
/>
```

### Authentication (To Be Implemented)

For production deployment, uncomment and implement the authentication checks in the API route to ensure only authorized users can download files.

## Security Considerations

- Files are retrieved directly from the database, not filesystem
- Only specific tableIds are supported to prevent arbitrary access
- Server-side validation prevents accessing data from other tables
- Implement the commented authentication code before production use

## Maintenance Notes

- The API is designed to be extendable to other tables
- Add new table support by extending the switch statement in the API route
- Add appropriate error logging in production for monitoring
- Consider implementing file streaming for very large datasets if needed
