# Testing Checklist for Multi-Document Implementation

## Frontend Component Tests

### Initial State

- [ ] Component loads correctly with loading indicator
- [ ] Empty state (no documents) displays correctly with upload button
- [ ] Component correctly shows an existing single document from the old API format
- [ ] Component correctly shows multiple documents from the new API format

### Document Display

- [ ] Document count badge appears correctly when multiple documents exist
- [ ] Document list is scrollable when many documents are present
- [ ] Total file size is calculated and displayed correctly
- [ ] Document metadata (name, date, size) is displayed correctly
- [ ] Long filenames are truncated with tooltips showing full name
- [ ] File size is correctly formatted (KB, MB, etc.)

### Document Operations

- [ ] Uploading a single document works correctly
- [ ] Uploading additional documents adds to the existing list
- [ ] "View" button opens the document in a new tab
- [ ] "Download" button downloads the document
- [ ] "Delete" button shows confirmation prompt
- [ ] Deleting a document removes only that specific document
- [ ] Upload button is always visible regardless of existing documents
- [ ] Upload process shows loading indicator during upload

### Error Handling

- [ ] Attempting to upload non-PDF files shows appropriate error
- [ ] Attempting to upload files larger than 10MB shows appropriate error
- [ ] Network errors during upload are handled gracefully
- [ ] Network errors during download/view are handled gracefully
- [ ] Network errors during deletion are handled gracefully
- [ ] API format mismatches are handled gracefully

### Edge Cases

- [ ] Component handles extremely long filenames appropriately
- [ ] Component handles a large number of documents (20+) appropriately
- [ ] Component works correctly when switching between rows with different document counts
- [ ] Custom event propagation works when documents are added/deleted

## Backend API Tests

### GET Endpoint

- [ ] Returns correct format for multiple documents
- [ ] Returns backward compatible format for legacy support
- [ ] Returns empty array when no documents exist
- [ ] Returns appropriate error for invalid row ID

### POST Endpoint

- [ ] Accepts and stores new documents correctly
- [ ] Preserves existing documents when adding new ones
- [ ] Returns correct metadata for newly uploaded document
- [ ] Returns appropriate errors for invalid files
- [ ] Enforces file size limits
- [ ] Enforces file type restrictions

### DELETE Endpoint

- [ ] Deletes specific document when ID is provided
- [ ] Deletes all documents when only row ID is provided (legacy support)
- [ ] Returns appropriate error when document doesn't exist
- [ ] Returns appropriate error for invalid IDs

### Download Endpoint

- [ ] Returns correct document when filename is provided
- [ ] Returns appropriate headers for download vs. view
- [ ] Returns appropriate error when document doesn't exist

## Database Tests

- [ ] Document metadata is stored correctly
- [ ] Files are stored with unique filenames
- [ ] Document retrieval by ID works correctly
- [ ] Document retrieval by filename works correctly
- [ ] Document deletion by ID works correctly

## Performance Tests

- [ ] Component renders efficiently with many documents
- [ ] Document list scrolls smoothly
- [ ] Upload/download operations perform within acceptable time limits
- [ ] Database queries are optimized for multiple documents

## Cross-browser Compatibility

- [ ] Component works correctly in Chrome
- [ ] Component works correctly in Firefox
- [ ] Component works correctly in Safari
- [ ] Component works correctly in Edge

## Mobile Responsiveness

- [ ] Component is usable on small screens
- [ ] Dropdown repositions correctly on mobile
- [ ] Touch interactions work correctly
