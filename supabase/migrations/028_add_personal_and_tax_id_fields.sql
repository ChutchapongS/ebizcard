-- Add personal ID and tax ID fields to profiles table
-- Migration: 028_add_personal_and_tax_id_fields.sql

-- Add personal ID field
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS personal_id VARCHAR(13);

-- Add tax ID fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tax_id_main VARCHAR(13),
ADD COLUMN IF NOT EXISTS tax_id_branch VARCHAR(13);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_personal_id ON public.profiles(personal_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tax_id_main ON public.profiles(tax_id_main);
CREATE INDEX IF NOT EXISTS idx_profiles_tax_id_branch ON public.profiles(tax_id_branch);

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.personal_id IS 'Personal ID number (เลขประจำตัวประชาชน)';
COMMENT ON COLUMN public.profiles.tax_id_main IS 'Tax ID for main office (เลขประจำตัวผู้เสียภาษี สำนักงานใหญ่)';
COMMENT ON COLUMN public.profiles.tax_id_branch IS 'Tax ID for branch office (เลขประจำตัวผู้เสียภาษี สาขาย่อย)';
