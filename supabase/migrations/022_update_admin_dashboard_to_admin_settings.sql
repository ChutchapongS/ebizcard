-- Update admin-dashboard to admin-settings in menu_visibility table
-- This migration updates existing data to use the new naming convention

-- Update existing admin-dashboard entries to admin-settings
UPDATE public.menu_visibility 
SET menu_key = 'admin-settings' 
WHERE menu_key = 'admin-dashboard';

-- Add comment for documentation
COMMENT ON TABLE public.menu_visibility IS 'Stores menu visibility settings for different user roles - Updated admin-dashboard to admin-settings';
