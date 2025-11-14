-- Fix admin-dashboard to admin-settings naming issue
-- This migration safely updates existing data without recreating policies

DO $$
BEGIN
    -- Check if both admin-dashboard and admin-settings exist
    IF EXISTS (SELECT 1 FROM public.menu_visibility WHERE menu_key = 'admin-dashboard') THEN
        IF EXISTS (SELECT 1 FROM public.menu_visibility WHERE menu_key = 'admin-settings') THEN
            -- Both exist, delete admin-dashboard entries
            DELETE FROM public.menu_visibility WHERE menu_key = 'admin-dashboard';
            RAISE NOTICE 'Deleted admin-dashboard entries (admin-settings already exists)';
        ELSE
            -- Only admin-dashboard exists, update to admin-settings
            UPDATE public.menu_visibility 
            SET menu_key = 'admin-settings' 
            WHERE menu_key = 'admin-dashboard';
            RAISE NOTICE 'Updated admin-dashboard entries to admin-settings';
        END IF;
    ELSE
        -- No admin-dashboard entries, check if admin-settings exists
        IF NOT EXISTS (SELECT 1 FROM public.menu_visibility WHERE menu_key = 'admin-settings') THEN
            INSERT INTO public.menu_visibility (menu_key, role, is_visible) VALUES
                ('admin-settings', 'owner', true),
                ('admin-settings', 'admin', true),
                ('admin-settings', 'user', false)
            ON CONFLICT (menu_key, role) DO NOTHING;
            RAISE NOTICE 'Inserted admin-settings entries';
        ELSE
            RAISE NOTICE 'admin-settings entries already exist';
        END IF;
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON TABLE public.menu_visibility IS 'Stores menu visibility settings for different user roles - Updated admin-dashboard to admin-settings';
