-- Data migration script for existing documents
-- This script will set the record_id column for existing documents
-- For existing documents, we'll use a combination of Ruttrabajador and id_doc to create a unique record_id

-- First, let's create a backup of the current table (always a good practice before migrations)
CREATE TABLE documentosajuntos_backup AS SELECT * FROM documentosajuntos;

-- Update all existing documents with a new record_id
-- As a temporary measure, we'll use a combination of the existing Ruttrabajador and id_doc
-- Later, you'll want to update these with the actual record IDs from your application
UPDATE documentosajuntos 
SET record_id = CONCAT(Ruttrabajador, '_', id_doc)
WHERE record_id IS NULL;

-- Note: In a real migration scenario, you would need a way to identify which records 
-- the existing documents should be associated with. This might involve:
-- 1. A UI that allows admins to assign documents to specific records
-- 2. A more sophisticated algorithm based on document upload dates and record creation dates
-- 3. Or simply associating all documents with the worker's primary/most recent record

-- Example of SQL that might be more appropriate for your specific use case:
-- UPDATE documentosajuntos d
-- JOIN (
--   SELECT Ruttrabajador, MAX(creation_date) as latest_date, actual_record_id
--   FROM your_records_table 
--   GROUP BY Ruttrabajador
-- ) r ON d.Ruttrabajador = r.Ruttrabajador
-- SET d.record_id = r.actual_record_id
-- WHERE d.record_id IS NULL; 