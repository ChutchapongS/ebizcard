-- Add tiktok column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tiktok TEXT NULL;

-- Create index for tiktok (for searching)
CREATE INDEX IF NOT EXISTS idx_profiles_tiktok 
ON public.profiles USING btree (tiktok) 
TABLESPACE pg_default
WHERE (tiktok IS NOT NULL AND tiktok <> '');

-- Comment
COMMENT ON COLUMN public.profiles.tiktok IS 'TikTok profile URL or username';

