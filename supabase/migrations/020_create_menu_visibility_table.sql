-- Create menu_visibility table for storing menu visibility settings
CREATE TABLE IF NOT EXISTS public.menu_visibility (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    menu_key TEXT NOT NULL,
    role TEXT NOT NULL,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(menu_key, role)
);

-- Insert default menu visibility settings
INSERT INTO public.menu_visibility (menu_key, role, is_visible) VALUES
    -- Dashboard
    ('dashboard', 'owner', true),
    ('dashboard', 'admin', true),
    ('dashboard', 'user', true),
    
    -- Theme Customization
    ('theme-customization', 'owner', true),
    ('theme-customization', 'admin', true),
    ('theme-customization', 'user', true),
    
    -- Settings
    ('settings', 'owner', true),
    ('settings', 'admin', true),
    ('settings', 'user', true),
    
    -- Admin Settings
    ('admin-settings', 'owner', true),
    ('admin-settings', 'admin', true),
    ('admin-settings', 'user', false)
ON CONFLICT (menu_key, role) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_menu_visibility_menu_key ON public.menu_visibility(menu_key);
CREATE INDEX IF NOT EXISTS idx_menu_visibility_role ON public.menu_visibility(role);

-- Enable Row Level Security
ALTER TABLE public.menu_visibility ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view menu visibility settings" ON public.menu_visibility;
DROP POLICY IF EXISTS "Admins and owners can update menu visibility settings" ON public.menu_visibility;
DROP POLICY IF EXISTS "Admins and owners can insert menu visibility settings" ON public.menu_visibility;

-- Create policy: Anyone can read menu visibility settings
CREATE POLICY "Anyone can view menu visibility settings"
ON public.menu_visibility FOR SELECT
TO public
USING (true);

-- Create policy: Only admins and owners can update menu visibility settings
CREATE POLICY "Admins and owners can update menu visibility settings"
ON public.menu_visibility FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND (user_type = 'admin' OR user_type = 'owner')
    )
);

-- Create policy: Only admins and owners can insert menu visibility settings
CREATE POLICY "Admins and owners can insert menu visibility settings"
ON public.menu_visibility FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND (user_type = 'admin' OR user_type = 'owner')
    )
);

-- Create or replace function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_menu_visibility_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_menu_visibility_updated_at ON public.menu_visibility;
CREATE TRIGGER trigger_update_menu_visibility_updated_at
    BEFORE UPDATE ON public.menu_visibility
    FOR EACH ROW
    EXECUTE FUNCTION update_menu_visibility_updated_at();

-- Grant permissions
GRANT SELECT ON public.menu_visibility TO anon, authenticated;
GRANT INSERT, UPDATE ON public.menu_visibility TO authenticated;

-- Create view for easy access to menu visibility
CREATE OR REPLACE VIEW menu_visibility_view AS
SELECT 
    menu_key,
    role,
    is_visible
FROM public.menu_visibility
ORDER BY menu_key, role;

-- Grant permissions on view
GRANT SELECT ON menu_visibility_view TO anon, authenticated;

-- Add comment for documentation
COMMENT ON TABLE public.menu_visibility IS 'Stores menu visibility settings for different user roles';
COMMENT ON COLUMN public.menu_visibility.menu_key IS 'The menu identifier (e.g., dashboard, settings)';
COMMENT ON COLUMN public.menu_visibility.role IS 'The user role (owner, admin, user)';
COMMENT ON COLUMN public.menu_visibility.is_visible IS 'Whether the menu is visible for this role';
