-- Migration 031: Remove tax_id_branch and add company_th field
-- This migration removes the tax_id_branch field and adds company_th field to profiles table

-- Remove tax_id_branch column from profiles table
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS tax_id_branch;

-- Drop index if exists
DROP INDEX IF EXISTS idx_profiles_tax_id_branch;

-- Add company_th column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company_th TEXT;

-- Add comment to the new column
COMMENT ON COLUMN public.profiles.company_th IS 'ชื่อบริษัท (ภาษาไทย)';

