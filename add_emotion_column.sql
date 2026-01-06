-- Add emotion column to bobo_equipped table
-- This migration adds support for storing equipped emotion items

ALTER TABLE bobo_equipped 
ADD COLUMN IF NOT EXISTS emotion TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN bobo_equipped.emotion IS 'ID of the equipped emotion item (references bobo_items.item_id where item_type=emotion)';

-- Update any existing records with NULL emotion to ensure consistency
-- (No action needed as NULL is the default for new columns)

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bobo_equipped' 
AND column_name = 'emotion';
