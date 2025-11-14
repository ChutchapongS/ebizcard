-- Create level_capabilities table for storing plan capabilities
CREATE TABLE IF NOT EXISTS public.level_capabilities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    plan_name TEXT UNIQUE NOT NULL,
    max_cards INTEGER NOT NULL DEFAULT 0,
    max_templates INTEGER NOT NULL DEFAULT 0,
    features JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default level capabilities
INSERT INTO public.level_capabilities (plan_name, max_cards, max_templates, features) VALUES
    ('Free', 3, 2, '["สร้างนามบัตรพื้นฐาน", "QR Code", "vCard Export", "1 ธีม"]'::jsonb),
    ('Standard', 10, 5, '["ทุกฟีเจอร์ของ Free", "ธีมเพิ่มเติม (5 ธีม)", "Analytics พื้นฐาน", "Contact Management"]'::jsonb),
    ('Pro', 50, 20, '["ทุกฟีเจอร์ของ Standard", "ธีมไม่จำกัด", "Analytics ขั้นสูง", "Custom Branding", "Priority Support"]'::jsonb)
ON CONFLICT (plan_name) DO NOTHING;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_level_capabilities_plan_name ON public.level_capabilities(plan_name);

-- Enable Row Level Security
ALTER TABLE public.level_capabilities ENABLE ROW LEVEL SECURITY;

-- Create policy: Anyone can read level capabilities
CREATE POLICY "Anyone can view level capabilities"
ON public.level_capabilities FOR SELECT
TO public
USING (true);

-- Create policy: Only admins and owners can update level capabilities
CREATE POLICY "Admins and owners can update level capabilities"
ON public.level_capabilities FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND (user_type = 'admin' OR user_type = 'owner')
    )
);

-- Create policy: Only admins and owners can insert level capabilities
CREATE POLICY "Admins and owners can insert level capabilities"
ON public.level_capabilities FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND (user_type = 'admin' OR user_type = 'owner')
    )
);

-- Create or replace function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_level_capabilities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_level_capabilities_updated_at ON public.level_capabilities;
CREATE TRIGGER trigger_update_level_capabilities_updated_at
    BEFORE UPDATE ON public.level_capabilities
    FOR EACH ROW
    EXECUTE FUNCTION update_level_capabilities_updated_at();

-- Grant permissions
GRANT SELECT ON public.level_capabilities TO anon, authenticated;
GRANT INSERT, UPDATE ON public.level_capabilities TO authenticated;

-- Create view for easy access to level capabilities
CREATE OR REPLACE VIEW level_capabilities_view AS
SELECT 
    plan_name,
    max_cards,
    max_templates,
    features
FROM public.level_capabilities
ORDER BY 
    CASE plan_name 
        WHEN 'Free' THEN 1 
        WHEN 'Standard' THEN 2 
        WHEN 'Pro' THEN 3 
        ELSE 4 
    END;

-- Grant permissions on view
GRANT SELECT ON level_capabilities_view TO anon, authenticated;

-- Add comment for documentation
COMMENT ON TABLE public.level_capabilities IS 'Stores capability limits for different user plans';
COMMENT ON COLUMN public.level_capabilities.plan_name IS 'The plan name (Free, Standard, Pro)';
COMMENT ON COLUMN public.level_capabilities.max_cards IS 'Maximum number of business cards allowed';
COMMENT ON COLUMN public.level_capabilities.max_templates IS 'Maximum number of templates allowed';
COMMENT ON COLUMN public.level_capabilities.features IS 'Array of features included in this plan';
