-- Add tambon field to addresses table
-- This field will store tambon/sub-district information

ALTER TABLE public.addresses 
ADD COLUMN IF NOT EXISTS tambon TEXT;

-- Add comment to describe the field
COMMENT ON COLUMN public.addresses.tambon IS 'ตำบล/แขวง (Tambon/Sub-district)';

-- Update existing records to have empty tambon if null
UPDATE public.addresses 
SET tambon = '' 
WHERE tambon IS NULL;
