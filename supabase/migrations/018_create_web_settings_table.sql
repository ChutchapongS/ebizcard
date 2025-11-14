-- Create web_settings table for storing website configuration
CREATE TABLE IF NOT EXISTS public.web_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO public.web_settings (setting_key, setting_value) VALUES
    ('logo_url', NULL),
    ('site_name', 'e-BizCard'),
    ('home_title', 'สร้างนามบัตรดิจิทัล'),
    ('home_subtitle', 'ที่ทันสมัย'),
    ('home_description', 'แพลตฟอร์มสร้างและแชร์นามบัตรดิจิทัลที่ครบครัน พร้อม QR Code, Analytics และการจัดการที่ง่ายดาย'),
    ('max_cards_per_user', '10'),
    ('max_templates_per_user', '5')
ON CONFLICT (setting_key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_web_settings_key ON public.web_settings(setting_key);

-- Enable Row Level Security
ALTER TABLE public.web_settings ENABLE ROW LEVEL SECURITY;

-- Create policy: Anyone can read settings
CREATE POLICY "Anyone can view web settings"
ON public.web_settings FOR SELECT
TO public
USING (true);

-- Create policy: Only admins and owners can update settings
CREATE POLICY "Admins and owners can update web settings"
ON public.web_settings FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND (user_type = 'admin' OR user_type = 'owner')
    )
);

-- Create policy: Only admins and owners can insert settings
CREATE POLICY "Admins and owners can insert web settings"
ON public.web_settings FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND (user_type = 'admin' OR user_type = 'owner')
    )
);

-- Create or replace function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_web_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_web_settings_updated_at ON public.web_settings;
CREATE TRIGGER trigger_update_web_settings_updated_at
    BEFORE UPDATE ON public.web_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_web_settings_updated_at();

-- Grant permissions
GRANT SELECT ON public.web_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.web_settings TO authenticated;

