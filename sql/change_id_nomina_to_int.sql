-- Migration script to change id_nomina column from varchar(255) to int
-- This aligns with the ID field type in the nominabeca table

-- First, create a backup of the current table
CREATE TABLE documentosajuntos_backup_nomina_migration AS SELECT * FROM documentosajuntos;

-- Convert any string values in id_nomina to integers where possible
-- Set invalid values to NULL
UPDATE documentosajuntos 
SET id_nomina = NULL 
WHERE id_nomina IS NOT NULL 
  AND (id_nomina = '' OR id_nomina REGEXP '[^0-9]');

-- Change the column type from varchar(255) to int
ALTER TABLE documentosajuntos 
MODIFY COLUMN id_nomina INT NULL 
COMMENT 'Foreign key reference to nominabeca.ID';

-- Create an index on id_nomina for better performance
CREATE INDEX idx_id_nomina ON documentosajuntos(id_nomina);

-- Add foreign key constraint to ensure referential integrity
ALTER TABLE documentosajuntos 
ADD CONSTRAINT fk_documentos_nomina 
FOREIGN KEY (id_nomina) REFERENCES nominabeca(ID) 
ON DELETE SET NULL ON UPDATE CASCADE; 