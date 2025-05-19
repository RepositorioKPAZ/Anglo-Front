-- Add record_id column to documentosajuntos table
ALTER TABLE documentosajuntos
ADD COLUMN record_id VARCHAR(100) NULL COMMENT 'Unique identifier for the specific row/record';

-- Create an index on record_id for faster lookups
CREATE INDEX idx_record_id ON documentosajuntos(record_id);

-- Update existing records (if needed, set to NULL for now)
-- UPDATE documentosajuntos SET record_id = NULL;

-- Note: After the migration, you should make this column required for new records
-- ALTER TABLE documentosajuntos MODIFY COLUMN record_id VARCHAR(100) NOT NULL; 