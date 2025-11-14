-- Add place field to addresses table
-- This field will store location names like building names, village names, condo names, etc.

ALTER TABLE public.addresses 
ADD COLUMN IF NOT EXISTS place TEXT;

-- Add comment to describe the field
COMMENT ON COLUMN public.addresses.place IS 'Location name (e.g., building name, village name, condo name)';

-- Update existing records to have empty place if null
UPDATE public.addresses 
SET place = '' 
WHERE place IS NULL;
