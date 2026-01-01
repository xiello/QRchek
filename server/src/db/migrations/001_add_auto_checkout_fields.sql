-- Migration: Add auto-checkout fields to attendance table
-- Run this if you have an existing database without these fields

-- Add auto_generated field (default false for existing records)
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT FALSE;

-- Add confirmed field (default false for existing records)
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS confirmed BOOLEAN DEFAULT FALSE;

-- Update any existing records to have false values (not null)
UPDATE attendance 
SET auto_generated = FALSE 
WHERE auto_generated IS NULL;

UPDATE attendance 
SET confirmed = FALSE 
WHERE confirmed IS NULL;

-- Verification query
SELECT 
  'Migration complete' as status,
  COUNT(*) as total_records,
  COUNT(auto_generated) as records_with_auto_generated,
  COUNT(confirmed) as records_with_confirmed
FROM attendance;
