-- Migration: Add English name field to user profiles
-- Created: 2024-01-XX
-- Description: Add full_name_english field to support English names in user profiles

-- This migration creates a simple profiles table to store English names
-- The application will continue to use user_metadata for the main storage

-- Step 1: Create profiles table (if not exists)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 1.1: Add full_name_english column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name_english TEXT DEFAULT '';

-- Step 2: Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Step 4: Create helper functions
CREATE OR REPLACE FUNCTION public.update_user_english_name(english_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name_english)
  VALUES (auth.uid(), english_name)
  ON CONFLICT (id) 
  DO UPDATE SET 
    full_name_english = EXCLUDED.full_name_english,
    updated_at = NOW();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_english_name()
RETURNS TEXT AS $$
DECLARE
  english_name TEXT;
BEGIN
  SELECT full_name_english INTO english_name
  FROM public.profiles 
  WHERE id = auth.uid();
  
  RETURN COALESCE(english_name, '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Grant permissions
GRANT EXECUTE ON FUNCTION public.update_user_english_name(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_english_name() TO authenticated;

-- Step 6: Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_english_name ON public.profiles(full_name_english);

-- Note: This migration creates a backup storage for English names.
-- The main application will continue to use user_metadata for storage.
