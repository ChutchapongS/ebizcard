-- Add user_type column to templates table to track who created the template
-- This allows us to show templates based on user permissions

-- Add user_type column to templates table
ALTER TABLE public.templates 
ADD COLUMN IF NOT EXISTS user_type TEXT;

-- Update existing templates to have user_type based on their creator
-- If user_id exists, get user_type from profiles table
UPDATE public.templates 
SET user_type = (
  SELECT p.user_type 
  FROM public.profiles p 
  WHERE p.id = templates.user_id
)
WHERE user_id IS NOT NULL;

-- For templates without user_id (system templates), set as 'admin'
UPDATE public.templates 
SET user_type = 'admin'
WHERE user_id IS NULL OR user_type IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.templates.user_type IS 'User type of the template creator (admin, owner, user) - determines visibility';

-- Create index for better performance when filtering by user_type
CREATE INDEX IF NOT EXISTS idx_templates_user_type ON public.templates(user_type);
CREATE INDEX IF NOT EXISTS idx_templates_user_id_user_type ON public.templates(user_id, user_type);
