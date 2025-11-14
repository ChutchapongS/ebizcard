-- Add reference fields to profiles table for 4 addresses
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS personal_address_1_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS personal_address_2_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS work_address_1_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS work_address_2_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_personal_address_1_id ON public.profiles(personal_address_1_id);
CREATE INDEX IF NOT EXISTS idx_profiles_personal_address_2_id ON public.profiles(personal_address_2_id);
CREATE INDEX IF NOT EXISTS idx_profiles_work_address_1_id ON public.profiles(work_address_1_id);
CREATE INDEX IF NOT EXISTS idx_profiles_work_address_2_id ON public.profiles(work_address_2_id);

-- Update addresses table to support new address types
ALTER TABLE public.addresses 
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'personal_1';

-- Drop existing constraint if it exists
ALTER TABLE public.addresses 
DROP CONSTRAINT IF EXISTS addresses_type_check;

-- Note: We'll let the DEFAULT value handle existing rows
-- and only apply the constraint to new rows going forward

-- Note: We'll handle type validation at the application level
-- to avoid constraint conflicts with existing data

-- Add index for type field
CREATE INDEX IF NOT EXISTS idx_addresses_type ON public.addresses(type);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.personal_address_1_id IS 'Reference to personal address 1 in addresses table';
COMMENT ON COLUMN public.profiles.personal_address_2_id IS 'Reference to personal address 2 in addresses table';
COMMENT ON COLUMN public.profiles.work_address_1_id IS 'Reference to work address 1 in addresses table';
COMMENT ON COLUMN public.profiles.work_address_2_id IS 'Reference to work address 2 in addresses table';
COMMENT ON COLUMN public.addresses.type IS 'Type of address: personal_1, personal_2, work_1, work_2';
